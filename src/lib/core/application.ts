import * as http from 'http';
import { Context } from './context';
import {
  MiddlewareFunc,
  IContext,
  IAppResponse,
  ApplicationOptions,
  ControllerDetails,
  AppErrorHandlerFunc,
  SYM_ERROR_HANDLER,
  AppErrorHandler,
} from '../interfaces';
import {
  SYM_MIDDLEWARE_PRIORITY,
  SYM_MIDDLEWARE_NAME
} from '../decorators/metaprops';

import {
  ComponentType,
  RequestMethodEnum as RequestMethod
} from '../enums';
import {
  errorHandler,
  responseWriter,
  routerWrapper,
  rejectLater,
  registerProcessEventListeners,
  getRouter,
  RouterErrorHandler
} from './apputils'

import {
  IRouter,
  IRouterConstructor
} from '../interfaces/irouter';
import {
  AllRoutes,
  SYM_ALL_ROUTES
} from './apputils/allroutes'

const debug = require('debug')('promiseoft:runtime:application');

const TAG = 'APPLICATION';

export class Application {

  private handlerStack: Array<MiddlewareFunc> = [];

  private errorHandler: AppErrorHandlerFunc;

  private timeout: number;

  private customErrorHandler: AppErrorHandlerFunc;

  private router: IRouter<IContext, Promise<IAppResponse>>;

  private aControllerDetails: Array<ControllerDetails>;

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
    extras.push(AllRoutes);

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


    debug(`${TAG} starting application with baseDir: ${options.baseDir} with timeout ${this.timeout} milliseconds`);

    let RouterClass: IRouterConstructor<IContext, Promise<IAppResponse>> = getRouter<IContext, Promise<IAppResponse>>();

    const routerOptions = {
      prefix:          options.baseUrl,
      errorController: RouterErrorHandler
    };

    this.router = new RouterClass(routerOptions);

    //const extraComponents = loadExtraComponents(extras);
    //debug(`LOADED EXTRA COMPONENTS **** ${extraComponents.length}   ${JSON.stringify(extraComponents)}`);

    //const loadedComponents = loadComponents(options.baseDir);
    //debug(`LOADED FILES **** ${loadedComponents.length}   ${JSON.stringify(loadedComponents)}`);
   // debug(`Registered Components: \n${Container.componentsList}`);

    //const allComponents = loadedComponents.concat(extraComponents);

/*

    const aMW: Array<MiddlewareFunc> = allComponents
    .filter(_ => _.type === ComponentType.MIDDLEWARE)
    .map(_ => <MiddlewareFunc>_.payload)
    .reduce((prev, curr) => prev.concat(curr), []);

    this.aControllerDetails = allComponents
    .filter(_ => _.type === ComponentType.CONTROLLER)
    .map(_ => <ControllerDetails>_.payload)
    .reduce((prev, curr) => prev.concat(curr), []);


    debug('%s aContollerDetails: %o', TAG, this.aControllerDetails);

    this.aControllerDetails.map(r => {
      r.requestMethods.map(rm => {
        let httpMethod = RequestMethod[rm].toLowerCase();
        debug(`Adding route ${r.name} for ${httpMethod} path: ${r.routePath}`);
        this.router.addRoute(r.routePath, RequestMethod[rm], r.ctrl, r.name);
        debug('added route ', r.routePath, RequestMethod[rm], r.name);
      });

    });

    aMW.push(routerWrapper(this.router));
    aMW.push(responseWriter);

    this.handlerStack = aMW.sort((a, b) => {
      return a[SYM_MIDDLEWARE_PRIORITY] - b[SYM_MIDDLEWARE_PRIORITY];
    });

    this.handlerStack.map(_ => debug(`${_[SYM_MIDDLEWARE_NAME]} = ${_[SYM_MIDDLEWARE_PRIORITY]}`));

    registerProcessEventListeners(Container);
    registerProcessEventListeners(this);
*/

  }

/*
  private initAllRoutesComponent(container: IContainer): Promise<IContainer> {
    debug('entered initAllRoutesComponent');
    const routesComponent: AllRoutes = container.getComponent(SYM_ALL_ROUTES);
    routesComponent.allControllers = this.aControllerDetails;

    return Promise.resolve(container);
  }*/


  onExit(): Promise<number> {
    let that = this;
    return new Promise((resolve, reject) => {
      let cleared = that.router.reset();
      console.log(`Cleared ${cleared} router nodes`);
      resolve(cleared);
    })
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

    const ctx = new Context(req, res);
    const handlerPromise = this.handlerStack.reduce((prev, next) => prev.then(next), Promise.resolve(<IContext>ctx));
    const runners: Array<Promise<IContext>> = [handlerPromise];
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
