import Context from './context';
import { Afterware } from '../lib/decorators';
import { Singleton } from 'bind';
import { HttpError } from '../lib/errors';
import HTTP_STATUS_CODES from 'http-status-enum';
import { PRIORITY_RESPONSE_WRITER } from '../lib/consts';

const debug = require('debug')('promiseoft:runtime:responsewriter');
const TAG = 'DEFAULT-RESPONSE-WRITER';

@Afterware(PRIORITY_RESPONSE_WRITER)
@Singleton
export default class ResponseWriter {

  doFilter(ctx: Context): Promise<Context> {

    debug('%s Entered defaultResponseWriter', TAG);
    let ret: Promise<Context>;

    if (!ctx.res.writableFinished) {

      ret = new Promise((resolve, reject) => {

        if (!ctx.res.headersSent) {
          debug('%s Getting appResponse statusCode', TAG);
          ctx.res.statusCode = ctx.appResponse.statusCode;

          for (const h in ctx.appResponse.headers) {
            ctx.res.setHeader(h, ctx.appResponse.headers[h]);
          }

          let rs = ctx.appResponse.getReadStream();
          debug('%s about to start writing response', TAG);

          ctx.res.on('finished', () => debug('%s res onFinished', TAG));
          ctx.res.on('close', () => debug('%s res onClosed', TAG));
          ctx.res.on('error', function (e) {
            reject(new HttpError(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, `Error while sending response ${e.message}`))//'%s res on error  %o', TAG, e);
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

  }
}
