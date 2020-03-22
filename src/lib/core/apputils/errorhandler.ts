import HttpStatusCode from 'http-status-enum';
import { Context } from '../context';

const debug = require('debug')('promiseoft:runtime:errorhandler');
const TAG = "DEFAULT-ERROR-HANDLER";

export function errorHandler(ctx: Context) {
    let responseTime: number = 0;
    let end;
    return e => {
        let errorMessage: string = "Internal Server Error";
        /**
         * @todo if instance of ApplicationError then use appropriate
         * response codes and messages
         */
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'string') {
            errorMessage = e;
        }

        end = Date.now();
        responseTime = (end - ctx.startTime);

        if (!ctx.res.finished) {
            ctx.res.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
            ctx.res.end(errorMessage);
            console.error(`${TAG} originalUrl=${ctx.requestUrl} requestMethod=${ctx.req.method} statusCode=${HttpStatusCode.INTERNAL_SERVER_ERROR} elapsedTime=${responseTime} errorMessage=${errorMessage}`);
        } else {
            debug('%s Response was already sent - %o', TAG, e);
        }

        debug('%s %s Request url %s request method: %s Trace: %s Response Took %d milliseconds', TAG, errorMessage, ctx.requestUrl, ctx.req.method, e.trace, responseTime)
    }
}



