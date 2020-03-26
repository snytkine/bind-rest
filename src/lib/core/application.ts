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
} from './apputils';

import {
  IfIocContainer,
  Container,
  load,
} from 'bind';

import * as path from 'path';
import setupRoutes from './apputils/setuproutes';
import getMiddlewares from './apputils/getmiddlewares';

const debug = require('debug')('promiseoft:runtime:application');

const TAG = 'APPLICATION';

export class Application {

  private handlerStack: Array<MiddlewareFunc> = [];

  private errorHandler: AppErrorHandlerFunc;

  private timeout: number;

  private customErrorHandler: AppErrorHandlerFunc;

  private container: IfIocContainer;

  /**
   * parse routes
   * create router
   *
   * parse middlewares
   *
   * generate handlerStack from sorted preProcessors, routerHandler, sorted postProcessors
   */
  constructor(options: ApplicationOptions) {

    this.errorHandler = errorHandler;
    const extras = options.extraComponents || [];
    //extras.push(AllRoutes);

    /**
     * Make sure timeout is integer number
     * will default to 0
     * @type {number}
     */
    this.timeout = ~~options.timeout;

    if (options.baseUrl) {
      if (!options.baseUrl.startsWith('/')) {
        throw new Error(`Bad value of baseUrl option "${options.baseUrl}" baseUrl must start with a "/"`);
      }

      if (options.baseUrl.endsWith('/')) {
        throw new Error(`Bad value of baseUrl option "${options.baseUrl}" baseUrl cannot end with a "/"`);
      }
    }

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
    this.handlerStack = getMiddlewares(this.container);
    debug('%s got %d middleware functions', TAG, this.handlerStack.length);

    registerProcessEventListeners(this);

  }

  /*
   private initAllRoutesComponent(container: IContainer): Promise<IContainer> {
   debug('entered initAllRoutesComponent');
   const routesComponent: AllRoutes = container.getComponent(SYM_ALL_ROUTES);
   routesComponent.allControllers = this.aControllerDetails;

   return Promise.resolve(container);
   }*/


  onExit(): Promise<number> {

    return new Promise((resolve, reject) => {
      resolve(1);
    });
  }

  /*
   private setCustomErrorHandler(c: IContainer) {
   debug(`${TAG} Entered setCustomErrorHandler()`);
   if (c.hasComponent(SYM_ERROR_HANDLER)) {
   const eh = <AppErrorHandler>c.getComponent(SYM_ERROR_HANDLER);
   debug(`${TAG} setting customErrorHandler ${eh.constructor.name}`);
   this.customErrorHandler = ctx => Reflect.apply(eh.handleError, eh, [ctx]);
   } else {
   debug(`${TAG} Custom Error Handler Not Found in Container`);
   this.customErrorHandler = this.errorHandler;
   }
   }*/


  /**
   * Main application request/response function
   * This method will be used to handle node.js request and write response
   *
   * @param req Node.js request http.IncomingMessage
   * @param res Node.js response http.ServerResponse
   */
  public handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {

    const ctx = new Context();
    ctx.initContext(req, res);
    const handlerPromise = this.handlerStack.reduce((prev, next) => prev.then(next), Promise.resolve(ctx));
    const runners: Array<Promise<Context>> = [handlerPromise];
    if (this.timeout > 0) {
      runners.push(rejectLater(this.timeout));
    }

    Promise.race(runners)
      .catch(this.customErrorHandler(ctx))
      .catch(this.errorHandler(ctx));
    debug('handleRequest method called');
  }

  /**
   * Important - handleRequest method must be defined before this method otherwise
   * it is not visible inside init()
   * @returns {Promise<(req:http.IncomingMessage, res:http.ServerResponse)=>undefined>}
   */

  /*init() {
   return Container.init()
   //.then(_ => this.initAllRoutesComponent(_))
   .then(_ => {
   this.setCustomErrorHandler(_)
   })
   .then(_ => {
   return (req: http.IncomingMessage, res: http.ServerResponse) => {
   this.handleRequest(req, res);
   }
   });
   }*/

  toString() {
    return 'Application Instance';
  }

}
