import {IRouter, IRouterConstructor, IRouterOptions} from "../../interfaces/irouter";
import {IContext} from '../../interfaces'
const debug = require('debug')('promiseoft:runtime:router');
const TAG = "ROUTER-FACTORY";


export class KoaRouterFactory<T, U> implements IRouter<T, U> {


  kr;
  handler;
  eh;

  constructor(options: IRouterOptions<IContext, U>) {

    // @ts-ignore
    this.kr = new KoaRouter(options);
    this.handler = this.kr.routes();
    this.eh = options.errorController;

  }

  addRoute(uri: string, method: string, ctrl: (ctx: T) => U, name: string): boolean {

    uri = uri.replace(/\{/g, ':').replace(/}/g, '');
    this.kr[method.toLowerCase()](name, uri, ctrl);

    return true;
  }

  route(ctx: T): U {
    let that = this;
    let routerErrorHandler = function () {
      return that.eh(ctx);
    };

    return this.handler(ctx, routerErrorHandler);

  }

  /**
   * This does not do anything in KoaRouter but we just need to implement the interface
   * @returns {number}
   */
  reset(){
    return 1;
  }

}

export function getRouter<T, U>(): IRouterConstructor<IContext, U> {

  let myRouter;
  try {
    myRouter = require('cpp_router');
    debug(`${TAG} cpp_router LOADED`);

    return myRouter.Router;
  } catch (e) {
    debug(`${TAG} cpp_router NOT loaded`);
    return KoaRouterFactory
  }

}

