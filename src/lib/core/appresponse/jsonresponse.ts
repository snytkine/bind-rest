import HttpResponseCode from 'http-status-enum';
import stringToStream from 'string-to-stream';
import { IResponseHeaders } from '../../types/responseheaders';
import { IJsonResponse } from '../../interfaces/appresponse';
import { IResponseCookieValue } from '../../interfaces/responsecookie';
import {CONTENT_TYPE, HEADER_NAMES, SYM_HAS_BODY} from '../../consts';

const debug = require('debug')('bind:rest:application');
const TAG = 'JSON_RESPONSE';

export default class JsonResponse<T> implements IJsonResponse<T> {

  public [SYM_HAS_BODY] = true;

  constructor(
    public json: T,
    public statusCode = HttpResponseCode.OK,
    public headers: IResponseHeaders = {
      [HEADER_NAMES.CONTENT_TYPE]: `${CONTENT_TYPE.APPLICATION_JSON};charset=utf-8`,
    },
    public cookies: NodeJS.Dict<IResponseCookieValue> = {},
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
    this.headers[HEADER_NAMES.CONTENT_TYPE] = `${CONTENT_TYPE.APPLICATION_JSON};charset=utf-8`;
  }

  get body() {
    debug('%s entered body(). Calling JSON.stringify', TAG);
    return JSON.stringify(this.json);
  }

  public getReadStream() {
    return stringToStream(this.body);
  }
}
