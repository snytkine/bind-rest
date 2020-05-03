import HttpResponseCode from 'http-status-enum';
import { IAppResponse, IResponseHeaders } from '../../interfaces';
import { IncomingHttpHeaders } from 'http';

export default class StreamResponse implements IAppResponse<any> {
  constructor(
    private rs: NodeJS.ReadableStream,
    public statusCode: HttpResponseCode = HttpResponseCode.OK,
    private hdrs: IncomingHttpHeaders,
  ) {
  }

  get headers(): IResponseHeaders<any> {
    return this.hdrs as IResponseHeaders<any>;
  }

  public getReadStream() {
    return this.rs;
  }
}
