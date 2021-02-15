import HttpResponseCode from 'http-status-enum';
import { IResponseHeaders } from '../../types';
import AppResponse from './appresponse';
import { IResponseCookie, IResponseCookieValue } from '../../interfaces/responsecookie';

export default class ErrorResponse extends AppResponse {
  constructor(
    responseCode: HttpResponseCode,
    message: string = 'Internal Application Error',
    headers?: IResponseHeaders,
    cookies?: NodeJS.Dict<IResponseCookieValue>,
  ) {
    super(message, responseCode, headers, cookies);
  }
}
