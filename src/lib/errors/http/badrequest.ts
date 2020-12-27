import HTTP_STATUS_CODES from 'http-status-enum';
import HttpResponseError from './responseerror';
import { IHttpRequestOptions } from '../../interfaces';

export default class BadRequestError extends HttpResponseError {
  constructor(message: string, options?: IHttpRequestOptions, innerError?: Error) {
    super(message, HTTP_STATUS_CODES.BAD_REQUEST, undefined, options, innerError);
  }
}
