import HttpResponseCode from 'http-status-enum';
import { IAppResponse } from '../../interfaces';
import { ResponseHeaders } from '../../types';

export default class StreamResponse implements IAppResponse {
  private rs: NodeJS.ReadableStream;

  constructor(
    rs: NodeJS.ReadableStream,
    public statusCode: HttpResponseCode = HttpResponseCode.OK,
    public headers: ResponseHeaders = {},
  ) {
    this.rs = rs;
  }

  public getReadStream() {
    return this.rs;
  }
}
