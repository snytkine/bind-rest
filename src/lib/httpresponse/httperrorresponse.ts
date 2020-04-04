import * as stream from 'stream';
import HttpResponse from './httpresponse';

export default class HttpErrorResponse extends HttpResponse {
  constructor(
    statusCode: number,
    error: string = '',
    headers: { [key: string]: any } = {},
    requestID: string = '-',
  ) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(error);
    super(statusCode, headers, bufferStream, requestID);
  }
}
