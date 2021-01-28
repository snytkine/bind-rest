import HttpResponseCode from 'http-status-enum';
import stringToStream from 'string-to-stream';
import { IAppResponse } from '../../interfaces';
import { IResponseHeaders } from '../../types/responseheaders';
import { IResponseCookie } from '../../interfaces/responsecookie';

const DEFAULT_CONTENT_TYPE = 'text/plain';
const DEFAULT_STATUS_CODE = HttpResponseCode.OK;

export default class AppResponse implements IAppResponse {
  protected responseBody: string;

  public readonly statusCode;

  public readonly headers;

  constructor(
    public body: string = '',
    public status?: number,
    readonly hdrs?: IResponseHeaders,
    public cookies?: Array<IResponseCookie>,
  ) {
    this.responseBody = body;
    this.statusCode = status || DEFAULT_STATUS_CODE;
    this.headers = hdrs || { 'content-type': DEFAULT_CONTENT_TYPE };
  }

  getReadStream() {
    return stringToStream(this.responseBody);
  }
}
