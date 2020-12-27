import HTTP_STATUS_CODES from 'http-status-enum';
import * as http from 'http';
import BindRestError from '../bindrest';
import { ErrorType } from '../../enums';
import { IHttpRequestOptions } from '../../interfaces';

export default class HttpResponseError extends BindRestError {
  constructor(
    message: string,
    public readonly statusCode: HTTP_STATUS_CODES,
    public readonly headers?: http.IncomingHttpHeaders,
    public readonly options?: IHttpRequestOptions,
    innerError?: Error,
  ) {
    super(message, ErrorType.HttpResponseError, innerError);
  }
}
