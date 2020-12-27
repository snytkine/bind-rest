import { Inject, isDefined, Singleton } from 'bind-di';
import HTTP_STATUS_CODES from 'http-status-enum';
import Context from './context';
import { Afterware } from '../lib/decorators';
import { PRIORITY_RESPONSE_WRITER, RESPONSE_COOKIES_WRITER } from '../lib/consts';
import { IResponseCookieWriter } from '../lib/interfaces/responsecookiewriter';
import HttpResponseError from '../lib/errors/http/responseerror';

const debug = require('debug')('bind:rest:runtime:responsewriter');

const TAG = 'DEFAULT-RESPONSE-WRITER';

/**
 * The ResponseWriter component is singleton, all requests/responses use
 * same instance. This component does not use state (no .this prop) and that is why
 * it's safe to use this component as Singleton
 */
@Afterware(PRIORITY_RESPONSE_WRITER)
@Singleton
export default class ResponseWriter {
  @Inject(RESPONSE_COOKIES_WRITER)
  responseCookieWriter: IResponseCookieWriter;

  doFilter(ctx: Context): Promise<Context> {
    debug('%s Entered defaultResponseWriter', TAG);
    let ret: Promise<Context>;

    if (!ctx.res.writableFinished) {
      ret = new Promise((resolve, reject) => {
        if (!ctx.res.headersSent) {
          debug('%s sending response headers', TAG);

          const cookieErrors = this.responseCookieWriter.sendCookies(ctx);
          if (isDefined(cookieErrors)) {
            cookieErrors.forEach((error) => ctx.errors.push(error));
          }

          /**
           * This check is not necessary because IAppResponse is required to have headers object
           * even if an empty object.
           * We may need to check that object has any own properties but not sure
           * if that is necessary.
           */
          if (ctx.appResponse.headers) {
            /**
             * writeHead does not actually write any data to socket.
             * if setHeader has been called prior to writeHead then writeHead
             * will merge header values with already set response headers object
             * if setHeader has not been called then it will set internal headers object
             * to this passed in headers. There are still many validations node.js does for
             * these headers and may throw if headers contain invalid chars (for example)
             */
            ctx.res.writeHead(ctx.appResponse.statusCode, ctx.appResponse.headers);
          } else {
            ctx.res.statusCode = ctx.appResponse.statusCode;
          }

          const rs = ctx.appResponse.getReadStream();
          debug('%s about to start writing response', TAG);

          ctx.res.on('finished', () => debug('%s res onFinished', TAG));
          ctx.res.on('close', () => debug('%s res onClosed', TAG));
          /**
           * @todo it's probably going to be too late to reject with HttpError
           * since this onError happens during writing a response. Since response already
           * started writing the only solution would be to close the response stream
           * and log error
           */
          ctx.res.on('error', function onResponseStreamError(err) {
            reject(
              new HttpResponseError(
                `Error while sending response ${err.message}`,
                HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
                undefined,
                undefined,
                err,
              ),
            ); // '%s res on error  %o', TAG, e);
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
    }

    debug('%s response already sent. Skipping responseWriter middleware', TAG);

    return Promise.resolve(ctx);
  }
}
