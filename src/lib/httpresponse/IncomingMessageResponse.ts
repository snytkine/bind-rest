import http from 'http';
import HTTP_STATUS_CODES from 'http-status-enum';
import { IResponseHeaders } from '../types';
import { IHttpIncomingMessageResponse } from '../interfaces/httpclientreponse';

export default class IncomingMessageResponse implements IHttpIncomingMessageResponse {
  constructor(private im: http.IncomingMessage, public readonly requestID: string = '-') {}

  public getReadStream(): http.IncomingMessage {
    return this.im;
  }

  get headers(): IResponseHeaders {
    return this.im.headers;
  }

  get statusCode(): HTTP_STATUS_CODES {
    return this.im.statusCode;
  }
}
