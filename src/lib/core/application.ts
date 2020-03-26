import * as http from 'http';
import Context from '../../components/context';
import {
  ApplicationOptions,
  AppErrorHandlerFunc,
} from '../interfaces';
import { MiddlewareFunc } from '../types';

import {
  errorHandler,
  rejectLater,
  registerProcessEventListeners,
  getErrorHandlers,
} from './apputils';

import {
  IfIocContainer,
  Container,
  load,
  Maybe,
  notEmpty
} from 'bind';

import * as path from 'path';
import setupRoutes from './apputils/setuproutes';
import getMiddlewares from './apputils/getmiddlewares';

const debug = require('debug')('promiseoft:runtime:application');
const TAG = 'APPLICATION';

export const validateOptions = (options: ApplicationOptions): void => {
  if (options.baseUrl) {
    if (!options.baseUrl.startsWith('/')) {
      throw new Error(`Bad value of baseUrl option "${options.baseUrl}" baseUrl must start with a "/"`);
    }

    if (options.baseUrl.endsWith('/')) {
      throw new Error(`Bad value of baseUrl option "${options.baseUrl}" baseUrl cannot end with a "/"`);
    }
  }
};

export class Application {

  private middlewares: Array<MiddlewareFunc> = [];

  private errHandlers: Array<AppErrorHandlerFunc> = [errorHandler];

  private container: IfIocContainer;

  private initialHandler: MiddlewareFunc;

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
    validateOptions(options);
    this.configOptions = options;
    const extras = options.extraComponents || [];
    //extras.push(AllRoutes);


    this.container = new Container();
    const frameworkComponentsDir = path.resolve(__dirname, '../../components');
    load(this.container, [...options.componentDirs, frameworkComponentsDir]);
    /**
     * @todo add extra components here, before parsing controllers because
     * extra components may container controllers and middlewares
     *
     */

    /**
     * All components are loaded into container
     * Now parse all controllers and add routes to router
     */
    setupRoutes(this.container);

    /**
     * Get all Middleware, sort then by order (lower order first)
     * and create array of middleware functions.
     */
    this.middlewares = getMiddlewares(this.container);
    this.initialHandler = this.middlewares.shift();
    debug('%s got %d middleware functions', TAG, this.middlewares.length);

    this.errHandlers = this.errHandlers.concat(getErrorHandlers(this.container)).filter(notEmpty);
    debug('%s count errHandlers=%s', TAG, this.errHandlers.length);

    registerProcessEventListeners(this);
  }

  /*
   private initAllRoutesComponent(container: IContainer): Promise<IContainer> {
   debug('entered initAllRoutesComponent');
   const routesComponent: AllRoutes = container.getComponent(SYM_ALL_ROUTES);
   routesComponent.allControllers = this.aControllerDetails;

   return Promise.resolve(container);
   }*/


  onExit(exitCode: number): Promise<number> {

    return new Promise((resolve) => {
      debug('%s onExit called with code=%d', TAG, exitCode);
      resolve(exitCode);
    });
  }


  /**
   * Main application request/response function
   * This method will be used to handle node.js request and write response
   *
   * @param req Node.js request http.IncomingMessage
   * @param res Node.js response http.ServerResponse
   */

  /*public handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {

   const ctx = (new Context()).init(req, res);

   const handlerPromise = this.middlewares.reduce((prev, next) => {
   return prev.then(next);
   }, this.initialHandler(ctx));

   const runners: Array<Promise<Context>> = [handlerPromise];
   if (this.configOptions?.timeout > 0) {
   runners.push(rejectLater(~~this.configOptions.timeout));
   }

   Promise.race(runners)
   .catch(e => this.errHandlers
   .map(eh => eh(ctx))
   .reduce((acc: Maybe<Error>, next) => {
   return next(acc);
   }, e));
   }*/

  /**
   * Important - handleRequest method must be defined before this method otherwise
   * it is not visible inside init()
   * @returns {Promise<(req:http.IncomingMessage, res:http.ServerResponse)=>undefined>}
   */

  init(): Promise<http.RequestListener> {
    return this.container.initialize()
      .then(() => (req: http.IncomingMessage, res: http.ServerResponse) => {

        const ctx = (new Context()).init(req, res);

        const handlerPromise = this.middlewares.reduce((prev, next) => {
          return prev.then(next);
        }, this.initialHandler(ctx));

        const runners: Array<Promise<Context>> = [handlerPromise];
        if (this.configOptions?.timeout > 0) {
          runners.push(rejectLater(~~this.configOptions.timeout));
        }

        Promise.race(runners)
          .catch(e => this.errHandlers
            .map(eh => eh(ctx))
            .reduceRight((acc: Maybe<Error>, next) => {
              return next(acc);
            }, e));

      });
  }

  toString() {
    return 'Application Instance';
  }

}
