import * as stream from 'stream';
import HttpResponse from './httpresponse';
import {StreamResponse} from "../core";
import {IHttpClientResponse} from "../interfaces/httpclientreponse";

export default class HttpErrorResponse extends StreamResponse implements IHttpClientResponse {
  constructor(
    statusCode: number,
    error: string = '',
    headers: { [key: string]: any } = {},
    requestID: string = '-',
  ) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(error);
    super(bufferStream, statusCode, headers);
  }
}
