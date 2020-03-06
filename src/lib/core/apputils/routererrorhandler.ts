import {IContext, IController} from '../../interfaces'
import {IAppResponse} from '../../interfaces/appresponse'
import {ErrorResponse} from "../appresponse";
import HttpStatusCode from 'http-status-enum';

export function RouterErrorHandler(ctx: IContext, e: any): Promise<IAppResponse> {

  let err = `Resource Not Found for path: ${ctx.path} Request Method: ${ctx.method}`;
  let status = HttpStatusCode.NOT_FOUND;

  if (e) {
    if (e.error) {
      err = err + " Error: " + err;
    }
    if (e.supportedMethods) {
      err = `Method ${ctx.method} is NOT supported for this URI. Supported methods are ${e.supportedMethods}`;
      status = HttpStatusCode.METHOD_NOT_ALLOWED;
    }
  }

  return Promise.resolve(new ErrorResponse(status, err));

}


