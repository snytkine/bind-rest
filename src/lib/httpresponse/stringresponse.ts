import { IncomingHttpHeaders } from 'http';
import { AppResponse } from '../core/appresponse';
import { IAppResponse } from '../interfaces';

/**
 * @todo add cookies
 */
export default class HttpStringResponse extends AppResponse implements IAppResponse {
  constructor(b: string = '', public statusCode: number, readonly headers: IncomingHttpHeaders) {
    super(b, statusCode, headers);
    this.body = this.responseBody;
  }


}
