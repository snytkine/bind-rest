import {IContext} from "../../interfaces/context";
import HttpStatusCode from 'http-status-enum';
import {ErrorResponse} from "../appresponse";

export function errorHandler(ctx: IContext)  {

  return (e: any): IContext => {
    let errorMessage: string = "Unresolved application Error";
    /**
     * @todo if instance of ApplicationError then use appropriate
     * response codes and messages
     */
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }

    console.error(`Default error handler ${errorMessage} Request url ${ctx.originalUrl} request method: ${ctx.method}`);
    if (!ctx.res.finished) {

      ctx.appResponse = new ErrorResponse(HttpStatusCode.INTERNAL_SERVER_ERROR);

    } else {
      console.error("Response was already sent");
    }

    /**
     * Returning ctx is important so that the chain of promises continues with ctx
     * otherwise all promises Middleware functions that run after error handler will receive undefined as
     * the resolved value while they all expecting IContext as resolved value
     */
    return ctx;
  }
}
