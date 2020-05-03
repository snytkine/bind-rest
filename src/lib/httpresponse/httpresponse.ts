import HttpStatusCode from 'http-status-enum';
import { IAppResponse, IResponseHeaders } from '../interfaces';
import { IncomingHttpHeaders } from 'http';

export default class HttpResponse implements IAppResponse<any> {
  constructor(
    public readonly statusCode: HttpStatusCode,
    private responseHeaders: IncomingHttpHeaders,
    private rs: NodeJS.ReadableStream,
    public readonly requestID: string = '-',
  ) {}

  public getReadStream() {
    return this.rs;
  }

  get headers(): IResponseHeaders<any> {
    return this.responseHeaders as IResponseHeaders<any>;
  }
}
