import HttpResponseCode from 'http-status-enum';
import { IResponseHeaders } from '../../types/responseheaders';
import AppResponse from './appresponse';
import { IJsonResponse } from '../../interfaces/appresponse';
import { IResponseCookie } from '../../interfaces/responsecookie';

const DEFAULT_CONTENT_TYPE = 'application/json';

export default class JsonResponse<T> extends AppResponse implements IJsonResponse<T> {
  constructor(
    private readonly jsonObj: T,
    statusCode = HttpResponseCode.OK,
    readonly hdrs?: IResponseHeaders,
    public cookies?: Array<IResponseCookie>,
  ) {
    /**
     * @TODO why stringify at the time of constructor?
     * Would it be better to stringify at time of getReadStream() call?
     * There is a chance that this response object will not even be used in case of
     * some exception thrown in afterware (after controller but before response writer)
     * then this stringify call will be a waste.
     *
     */
    super(JSON.stringify(jsonObj), statusCode, hdrs, cookies);
    /**
     * The content-type header will always be application/json
     * even if user supplied different value by mistake
     *
     * @TODO if user supplied header using different case for name
     * like for example Content-Type we need to delete it.
     * For this to work we should convert all header names to lower case, which
     * is extra performance hit.
     */
    this.headers['content-type'] = DEFAULT_CONTENT_TYPE;
  }

  get json() {
    return this.jsonObj;
  }
}
