import {IAppResponse} from "../interfaces";
import http from "http";
import HTTP_STATUS_CODES from "http-status-enum";
import {IResponseHeaders} from "../types";
import {IHttpClientResponse} from "../interfaces/httpclientreponse";


export default class IncomingMessageResponse implements IHttpClientResponse {

  constructor(private im: http.IncomingMessage, public readonly requestId: string = '-') {
  }

  public getReadStream(): NodeJS.ReadableStream {
    return this.im;
  }

  get headers(): IResponseHeaders {
    return this.im.headers;
  }

  get statusCode(): HTTP_STATUS_CODES {
    return this.im.statusCode;
  }

}
