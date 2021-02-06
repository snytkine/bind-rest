import http from 'http';
import path from 'path';
import { IfIocContainer, Container, load, isDefined } from 'bind-di';
import Context from '../../components/context';
import { ApplicationOptions } from '../interfaces/application';
import { MiddlewareFunc } from '../types/middlewarefunc';
import setupRoutes from './apputils/setuproutes';
import getMiddlewares from './apputils/getmiddlewares';
import defaultErrorFormatter from './apputils/defaulterrorformatter';
import registerProcessEventListeners from './apputils/processexithelper';
import ApplicationError from '../errors/applicationerror';
import { IAppResponse, IExitHandler, WriteServerResponseFunc } from '../interfaces';
import { FormatErrorFunc } from '../interfaces/errorformater';
import getResponseFromContext from './apputils/getresponsefromcontext';
import defaultResponseWriter from './apputils/defaultresponsewriter';

const debug = require('debug')('bind:rest:runtime:application');

const TAG = 'APPLICATION';
const APPLICATION_COMPONENTS_DIR = path.resolve(__dirname, '../../components');

export const validateOptions = (options: ApplicationOptions): void => {
  if (options.baseUrl) {
    if (!options.baseUrl.startsWith('/')) {
      throw new Error(
        `Bad value of baseUrl option "${options.baseUrl}" baseUrl must start with a "/"`,
      );
    }

    if (options.baseUrl.endsWith('/')) {
      throw new Error(
        `Bad value of baseUrl option "${options.baseUrl}" baseUrl cannot end with a "/"`,
      );
    }
  }
};

export class Application implements IExitHandler {
  private middlewares: Array<MiddlewareFunc> = [];

  // private errHandlers: Array<IErrorFormatter> = [defaultErrorFormatter];

  private bindContainer: IfIocContainer;

  private configOptions: ApplicationOptions;

  /**
   * parse routes
   * create router
   *
   * parse middlewares
   *
   * generate middlewares from sorted preProcessors, routerHandler, sorted postProcessors
   */
  constructor(options: ApplicationOptions) {
    this.settings = options;

    this.bindContainer = new Container();

    registerProcessEventListeners(this);
  }

  get settings(): ApplicationOptions {
    return this.configOptions;
  }

  set settings(options: ApplicationOptions) {
    validateOptions(options);
    this.configOptions = options;
  }

  get container() {
    return this.bindContainer;
  }

  /**
   * Initialize container
   * then setup middlewares, routes, errorHandlers
   * register this application as container component
   * and then set the container as instance variable
   * of this application object
   *
   * It therefore should be possible to replace the container
   * with another container in the running application
   * but only if passed-in container initializes without errors.
   *
   * @param container
   */
  public async setContainer(container: IfIocContainer): Promise<IfIocContainer> {
    load(
      container,
      [...this.configOptions.componentDirs, APPLICATION_COMPONENTS_DIR],
      this.settings.envOverrideVar,
    );
    /**
     * @todo add extra components here, before parsing controllers because
     * extra components may contain controllers and middlewares
     *
     */
    try {
      await container.initialize();

      /**
       * registerApplicationComponent must be called first, before
       * parsing controllers and middlewares because
       * controller middlewares may be using custom middleware functions
       * that receive container and return MiddlewareFunc
       * before returning MiddlewareFunc these factories may need to get
       * Application component from container in order to get some settings.
       */
      // this.registerApplicationComponent(container);

      /**
       * All components are loaded into container
       * Now parse all controllers and add routes to router
       */
      setupRoutes(container);

      /**
       * Get all Middleware, sort then by order (lower order first)
       * and create array of middleware functions.
       */
      this.middlewares = getMiddlewares(container);
      debug('%s got %d middleware functions', TAG, this.middlewares.length);

      // this.errHandlers = this.errHandlers.concat(getErrorHandlers(container)).filter(notEmpty);
      // debug('%s count errHandlers=%s', TAG, this.errHandlers.length);

      /**
       * @todo using previous container was a way to redefine
       * the this.bindContainer, make it possible to replace
       * the IocContainer in the running application
       * This was just an experiment and for the time being
       * was decided not to use this feature.
       */
      // const previousContainer = this.bindContainer;
      this.bindContainer = container;
      return this.bindContainer;
    } catch (e) {
      throw new ApplicationError(`Failed to initialize container Error=${e.message}`, e);
    }
  }

  /* registerApplicationComponent(container: IfIocContainer) {
   container.addComponent({
   identity: Identity(APPLICATION_COMPONENT),
   propDependencies: [],
   constructorDependencies: [],
   extraDependencies: [],
   scope: ComponentScope.SINGLETON,
   get: () => this,
   });
   } */

  /* registerConfigurationComponent(container: IfIocContainer) {
   container.addComponent({
   identity: Identity(CONFIGURATION_COMPONENT),
   propDependencies: [],
   constructorDependencies: [],
   extraDependencies: [],
   scope: ComponentScope.SINGLETON,
   get: () => this,
   });
   } */

  onExit(exitCode: number): Promise<number> {
    debug('%s %s onExit called with code=%d', TAG, this.toString(), exitCode);

    return this.container.cleanup().then((status) => {
      debug('%s Container cleanup completed with res="%s"', TAG, status);
      return exitCode;
    });
  }

  /**
   * @todo in the future look in container for component with special id like ERROR_FORMATTER
   * passing context to container.getComponent because this component may be Context-Scoped.
   *
   * and return it if found otherwise return defaultErrorFormatter
   * @param context
   * @private
   */
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  private getErrorFormatter(context: Context): FormatErrorFunc {
    return defaultErrorFormatter;
  }

  /**
   * todo in the future may get component with ID RESPONSE_WRITER and use it
   * if its available. On initiation try to get that component meta and set as responseWriteComponent
   * Then from this function call components' get(context) so that component may be Context-scoped.
   *
   * @param context
   * @private
   */
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  private getResponseWriter(context: Context): WriteServerResponseFunc {
    return defaultResponseWriter;
  }

  public getAppResponse(context: Context): Promise<IAppResponse> {
    const handlerPromise = this.middlewares.reduce((prev, next) => {
      return prev.then(next);
    }, Promise.resolve(context));

    const runners: Array<Promise<Context>> = [handlerPromise];

    /**
     * @Todo create way to deal with timeout.
     * Probably best thing would be to reject with Error of type BindRest Error or with HttpResponseError with status code TIMEOUT
     * Can also just return Promise of TimeoutResponse.
     *
     *
     */

    /* if (this.configOptions?.timeout > 0) {
      runners.push(rejectLater(Math.floor(Math.abs(this.configOptions.timeout))));
    } */

    return Promise.race(runners)
      .then(getResponseFromContext)
      .catch((error) => {
        const errorFormatter = this.getErrorFormatter(context);
        return errorFormatter(error);
      });
  }

  /**
   * Main application request/response function
   * This method will be used to handle node.js request and write response
   *
   * @param req Node.js request http.IncomingMessage
   * @param res Node.js response http.ServerResponse
   */
  public handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const ctx = Context.create(req);

    this.getAppResponse(ctx).then((appResponse) => this.getResponseWriter(ctx)(appResponse, res));
  }

  init(): Promise<boolean> {
    return this.setContainer(this.container).then((previous) => {
      debug('%s finished setContainer. has previousContainer %s', TAG, isDefined(previous));

      return true;
    });
  }

  toString() {
    return `Application Instance with ${this.bindContainer?.components?.length ?? 0} components`;
  }
}
