import http from 'http';
import path from 'path';
import {
  IfIocContainer,
  Container,
  load,
  Maybe,
  notEmpty,
  Identity,
  ComponentScope,
  isDefined,
} from 'bind';
import Context from '../../components/context';
import { ApplicationOptions } from '../interfaces/application';
import { MiddlewareFunc } from '../types/middlewarefunc';
import rejectLater from './apputils/rejectlater';
import setupRoutes from './apputils/setuproutes';
import getMiddlewares from './apputils/getmiddlewares';
import { APPLICATION_COMPONENT } from '../consts/appcomponents';
import { AppErrorHandlerFunc } from '../interfaces/apperrorhandler';
import errorHandler from './apputils/errorhandler';
import getErrorHandlers from './apputils/geterrorhandlers';
import registerProcessEventListeners from './apputils/processexithelper';
import ApplicationError from '../errors/applicationerror';

const debug = require('debug')('promiseoft:runtime:application');

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

export class Application {
  private middlewares: Array<MiddlewareFunc> = [];

  private errHandlers: Array<AppErrorHandlerFunc> = [errorHandler];

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
  public async setContainer(container: IfIocContainer): Promise<Maybe<IfIocContainer>> {
    load(container, [...this.configOptions.componentDirs, APPLICATION_COMPONENTS_DIR]);
    /**
     * @todo add extra components here, before parsing controllers because
     * extra components may container controllers and middlewares
     *
     */
    try {
      const initializedContainer: IfIocContainer = await container.initialize();
      /**
       * All components are loaded into container
       * Now parse all controllers and add routes to router
       */
      setupRoutes(initializedContainer);

      /**
       * Get all Middleware, sort then by order (lower order first)
       * and create array of middleware functions.
       */
      this.middlewares = getMiddlewares(initializedContainer);
      debug('%s got %d middleware functions', TAG, this.middlewares.length);

      this.errHandlers = this.errHandlers
        .concat(getErrorHandlers(initializedContainer))
        .filter(notEmpty);
      debug('%s count errHandlers=%s', TAG, this.errHandlers.length);

      this.registerApplicationComponent(initializedContainer);
      const previousContainer = this.bindContainer;
      this.bindContainer = initializedContainer;

      return previousContainer;
    } catch (e) {
      throw new ApplicationError(`Failed to initialize container Error=${e.message}`, e);
    }
  }

  registerApplicationComponent(container: IfIocContainer) {
    container.addComponent({
      identity: Identity(APPLICATION_COMPONENT),
      propDependencies: [],
      constructorDependencies: [],
      extraDependencies: [],
      scope: ComponentScope.SINGLETON,
      get: () => this,
    });
  }

  onExit(exitCode: number): Promise<number> {
    debug('%s %s onExit called with code=%d', TAG, this.toString(), exitCode);

    return this.container.cleanup().then((status) => {
      debug('%s Container cleanup completed with res="%s"', TAG, status);
      return exitCode;
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
    const ctx = new Context().init(req, res);

    const handlerPromise = this.middlewares.reduce((prev, next) => {
      return prev.then(next);
    }, Promise.resolve(ctx));

    const runners: Array<Promise<Context>> = [handlerPromise];
    if (this.configOptions?.timeout > 0) {
      runners.push(rejectLater(Math.floor(Math.abs(this.configOptions.timeout))));
    }

    Promise.race(runners).catch((e) => {
      return this.errHandlers
        .map((eh) => eh(ctx))
        .reduceRight((acc: Maybe<Error>, next) => {
          return next(acc);
        }, e);
    });
  }

  init(): Promise<http.RequestListener> {
    return this.setContainer(this.container).then((previous) => {
      debug('%s finished setContainer. previousContainer %s', TAG, isDefined(previous));
      return (req: http.IncomingMessage, res: http.ServerResponse) => {
        return this.handleRequest(req, res);
      };
    });
  }

  toString() {
    return `Application Instance with ${this.bindContainer.components.length} components`;
  }
}
