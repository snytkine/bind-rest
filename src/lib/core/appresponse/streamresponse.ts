import HttpResponseCode from 'http-status-enum';
import { IAppResponse } from '../../interfaces';
import { IResponseHeaders } from '../../types/responseheaders';
import { IResponseCookie } from '../../interfaces/responsecookie';

export default class StreamResponse implements IAppResponse {
  public readonly headers;

  constructor(
    private rs: NodeJS.ReadableStream,
    public statusCode: HttpResponseCode = HttpResponseCode.OK,
    readonly hdrs?: IResponseHeaders,
    public cookies?: Array<IResponseCookie>,
  ) {
    this.headers = hdrs || {};
  }

  public getReadStream() {
    return this.rs;
  }
}
