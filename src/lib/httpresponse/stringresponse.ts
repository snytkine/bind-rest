import { AppResponse } from '../core/appresponse';
import HttpResponseCode from 'http-status-enum';
import { IncomingHttpHeaders } from 'http';

export default class HttpStringResponse extends AppResponse {

  constructor(b: string = '',
              public statusCode: HttpResponseCode,
              headers: IncomingHttpHeaders) {
    super(b, statusCode, headers);
  }

  get body(): string {
    return this.responseBody;
  }
}
