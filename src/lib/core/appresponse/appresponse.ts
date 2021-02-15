import HttpResponseCode from 'http-status-enum';
import stringToStream from 'string-to-stream';
import { IAppResponseWithBody } from '../../interfaces';
import { IResponseHeaders } from '../../types/responseheaders';
import { IResponseCookieValue } from '../../interfaces/responsecookie';
import { HEADER_NAMES } from '../../consts';

const DEFAULT_CONTENT_TYPE = 'text/plain';
const DEFAULT_STATUS_CODE = HttpResponseCode.OK;

export default class AppResponse implements IAppResponseWithBody {
  constructor(
    public body: string = '',
    public statusCode: number = DEFAULT_STATUS_CODE,
    public headers: IResponseHeaders = { [HEADER_NAMES.CONTENT_TYPE]: DEFAULT_CONTENT_TYPE },
    public cookies: NodeJS.Dict<IResponseCookieValue> = {},
  ) {}

  getReadStream() {
    return stringToStream(this.body);
  }
}
