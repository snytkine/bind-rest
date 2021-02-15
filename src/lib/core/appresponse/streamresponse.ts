import HttpResponseCode from 'http-status-enum';
import { IResponseHeaders } from '../../types/responseheaders';
import { IResponseCookie, IResponseCookieValue } from '../../interfaces/responsecookie';
import { IAppResponse } from '../../interfaces';

export default class StreamResponse implements IAppResponse {
  constructor(
    private rs: NodeJS.ReadableStream,
    public statusCode: HttpResponseCode = HttpResponseCode.OK,
    public headers: IResponseHeaders = {},
    public cookies: NodeJS.Dict<IResponseCookieValue> = {},
  ) {}

  public getReadStream() {
    return this.rs;
  }
}
