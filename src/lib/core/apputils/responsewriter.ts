import {SYM_MIDDLEWARE_PRIORITY, SYM_MIDDLEWARE_NAME} from "../../decorators/metaprops";
import {IContext} from "../../interfaces/context";

const debug = require('debug')('promiseoft:runtime:responsewriter');
const TAG = 'DEFAULT-RESPONSE-WRITER';
/**
 * @todo deprecate this file. Now there is a ResponseWriter middleware
 * in components directory
 *
 * @param ctx
 */
const responseWriter = function (ctx: IContext): Promise<IContext> {

  debug("%s Entered defaultResponseWriter", TAG);
  let ret: Promise<IContext>;

  if (!ctx.res.writableFinished) {

    ret = new Promise((resolve, reject) => {

      if (!ctx.res.headersSent) {
        debug('%s Getting appResponse statusCode', TAG);
        ctx.res.statusCode = ctx.appResponse.statusCode;
        debug('%s GOT statusCode', TAG);
        for (const h in ctx.appResponse.headers) {
          ctx.res.setHeader(h, ctx.appResponse.headers[h]);
        }

        let rs = ctx.appResponse.getReadStream();
        debug('%s about to start writing response', TAG);

        ctx.res.on('finished', () => debug('%s res onFinished', TAG));
        ctx.res.on('close', () => debug('%s res onClosed', TAG));
        ctx.res.on('error', function (e) {
          debug('%s res on error  %o', TAG, e);
        });

        rs.on('end', () => {
          debug('%s rs onEnd', TAG);
          resolve(ctx);
        });

        rs.pipe(ctx.res);

      } else {
        debug('%s headers already sent', TAG);
      }

    });

    return ret;

  } else {
    debug('%s response already sent. Skipping responseWriter middleware', TAG);
    return Promise.resolve(ctx);
  }

};

responseWriter[SYM_MIDDLEWARE_PRIORITY] = 100;
responseWriter[SYM_MIDDLEWARE_NAME] = "defaultResponseWriter";

export {responseWriter};

