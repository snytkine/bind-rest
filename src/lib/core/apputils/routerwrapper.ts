import "reflect-metadata";
import {MiddlewareFunc} from "../../types";
import {IContext, IAppResponse} from "../../interfaces/";
import {ErrorResponse} from "../appresponse";
import HttpStatusCode from 'http-status-enum';
import {SYM_MIDDLEWARE_NAME, SYM_MIDDLEWARE_PRIORITY} from "../../decorators/metaprops";
import {IRouter} from "../../interfaces/irouter";
import { Context } from '../../../components/context';
const debug = require('debug')('promiseoft:runtime:router');
const TAG = "ROUTER-WRAPPER";
/*

export function routerWrapper(router: IRouter<IContext, Promise<IAppResponse>>): MiddlewareFunc {

  const ret = function routeDispatcher(ctx: Context): Promise<Context> {
    debug("Entered Router Middleware");
    if (!ctx || !ctx.res || ctx.res.writableEnded) {
      debug('Response already sent. Controller function will not be called');
      return Promise.resolve(ctx);
    } else if (ctx.appResponse) {
      debug('%s appResponse already set', TAG);
      return Promise.resolve(ctx);
    } else {


      /!**
       * Custom error response if route not found for request method
       * attempt to find matches for other http methods and if found
       * return method not allowed error 405
       * @returns {ErrorResponse}
       *!/
    /!*  const notAllowed = function () {
        let allowed: string[];
        if (ctx.matched) {
          allowed = ctx.matched.reduce((prev, next) => {
            return prev.concat(...next.methods)
          }, []);
        } else {
          debug("NO MATCHED ROUTES IN CONTEXT");
        }

        if (allowed.length > 0) {
          debug('Found some matched routes %o', allowed);
          return Promise.resolve(new ErrorResponse(HttpStatusCode.METHOD_NOT_ALLOWED, `Method ${ctx.method} is not allowed for this uri. Allowed methods: ${allowed.join(",")}`));
        }
        debug(`NO MATCHES FOR ANY METHOD for url: ${ctx.originalUrl}`);
        return Promise.resolve(new ErrorResponse(HttpStatusCode.NOT_FOUND, `Resource Not Found ${ctx.originalUrl}`));
      };*!/


      return router.route(ctx).then(ctrlResponse => {
        ctx.appResponse = ctrlResponse;
        return ctx;
      })
    }
  };

  ret[SYM_MIDDLEWARE_NAME] = "Router";
  ret[SYM_MIDDLEWARE_PRIORITY] = 0;

  return ret;
}
*/

