import stream from 'stream';
import HttpStatusCode from 'http-status-enum';
import HttpResponse from './httpresponse';
import { IncomingHttpHeaders } from 'http';

export default class HttpErrorResponse extends HttpResponse {
  constructor(
    statusCode: HttpStatusCode,
    error: string = '',
    headers: IncomingHttpHeaders,
    requestID: string = '-',
  ) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(error);
    super(statusCode, headers, bufferStream, requestID);
  }
}
