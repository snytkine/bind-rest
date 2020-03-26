import HTTP_STATUS_CODES from 'http-status-enum';
import Context from '../../../components/context';
import { AppErrorHandlerFunc } from '../../interfaces';
import { isDefined, Maybe } from 'bind';
import { HttpError } from 'http-errors';

const debug = require('debug')('promiseoft:runtime:errorhandler');
const TAG = 'DEFAULT-ERROR-HANDLER';

const errorHandler: AppErrorHandlerFunc = (ctx: Context) => {
  let responseTime: number = 0;
  let end: number;
  let httpCode: HTTP_STATUS_CODES = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  return function defaultErrorHandler(e: Maybe<Error>) {

    let errorMessage: string = 'Internal Server Error';

    if (isDefined(e)) {

      errorMessage = e.message;
      if (e instanceof HttpError) {
        httpCode = e.statusCode;
      }

      end = Date.now();
      responseTime = (end - ctx.startTime);

      debug('%s errorMessage="%s" requestUrl="%s" requestMethod="%s" stack="%s" responseTime="%d"',
        TAG,
        errorMessage,
        ctx.requestUrl,
        ctx.req.method,
        e.stack,
        responseTime);


      if (!ctx.res.writableEnded) {
        ctx.res.statusCode = httpCode;
        ctx.res.end(errorMessage);
        debug('%s error sent', TAG);
      } else {
        debug('%s Response was already sent for url="%s" method="%s" error=%o',
          TAG,
          ctx.requestUrl,
          ctx.req.method,
          e);
      }
    } else {
      debug('%s Not and error. Most likely was already handled by another error handler', TAG);
    }

    return undefined;
  };
};

export default errorHandler;



