import { AppResponse } from '../core/appresponse';
import { IAppResponse } from '../interfaces';
import {IncomingHttpHeaders} from "http";

/**
 * @todo add cookies
 */
export default class HttpStringResponse extends AppResponse implements IAppResponse {
  constructor(
    b: string = '',
    public statusCode: number,
    readonly headers: IncomingHttpHeaders,
  ) {
    super(b, statusCode, headers);
  }

  get body(): string {
    return this.responseBody;
  }
}
