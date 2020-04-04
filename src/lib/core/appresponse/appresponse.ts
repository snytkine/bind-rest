import HttpResponseCode from 'http-status-enum';
import stream from 'stream';
import { IAppResponse } from '../../interfaces';
import { ResponseHeaders } from '../../types/responseheaders';

export default class AppResponse implements IAppResponse {
  protected readonly responseBody: string;

  constructor(
    b: string = '',
    public statusCode: number = HttpResponseCode.OK,
    readonly headers: ResponseHeaders = { 'content-type': 'text/plain' },
  ) {
    this.responseBody = b;
  }

  getReadStream() {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(this.responseBody);
    return bufferStream;
  }
}
