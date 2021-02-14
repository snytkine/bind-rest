import HttpResponseCode from 'http-status-enum';
import stringToStream from 'string-to-stream';
import { IAppResponseWithBody } from '../../interfaces';
import { IResponseHeaders } from '../../types/responseheaders';
import { IResponseCookie } from '../../interfaces/responsecookie';

const DEFAULT_CONTENT_TYPE = 'text/plain';
const DEFAULT_STATUS_CODE = HttpResponseCode.OK;

export default class AppResponse implements IAppResponseWithBody {
  constructor(
    public body: string = '',
    public statusCode: number = DEFAULT_STATUS_CODE,
    public headers: IResponseHeaders = { 'content-type': DEFAULT_CONTENT_TYPE },
    public cookies?: Array<IResponseCookie>,
  ) {}

  getReadStream() {
    return stringToStream(this.body);
  }
}
