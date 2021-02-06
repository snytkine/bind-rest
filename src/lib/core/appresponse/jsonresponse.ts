import HttpResponseCode from 'http-status-enum';
import stringToStream from 'string-to-stream';
import { IResponseHeaders } from '../../types/responseheaders';
import { IJsonResponse } from '../../interfaces/appresponse';
import { IResponseCookie } from '../../interfaces/responsecookie';
import { CONTENT_TYPE, HEADER_NAMES } from '../../consts';

export default class JsonResponse<T> implements IJsonResponse<T> {
  constructor(
    public json: T,
    public statusCode = HttpResponseCode.OK,
    public headers: IResponseHeaders = {
      [HEADER_NAMES.CONTENT_TYPE]: CONTENT_TYPE.APPLICATION_JSON,
    },
    public cookies?: Array<IResponseCookie>,
  ) {
    /**
     * The content-type header will always be application/json
     * even if user supplied different value by mistake
     *
     * @TODO if user supplied header using different case for name
     * like for example Content-Type we need to delete it.
     * For this to work we should convert all header names to lower case, which
     * is extra performance hit.
     */
    this.headers[HEADER_NAMES.CONTENT_TYPE] = CONTENT_TYPE.APPLICATION_JSON;
  }

  get body() {
    return JSON.stringify(this.json);
  }

  public getReadStream() {
    return stringToStream(this.body);
  }
}
