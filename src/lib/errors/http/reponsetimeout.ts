import HTTP_STATUS_CODES from 'http-status-enum';
import HttpResponseError from './responseerror';
import { IHttpRequestOptions } from '../../interfaces';

export default class ResponseTimeoutError extends HttpResponseError {
  constructor(message: string, options: IHttpRequestOptions) {
    super(message, HTTP_STATUS_CODES.GATEWAY_TIMEOUT, undefined, options);
  }
}
