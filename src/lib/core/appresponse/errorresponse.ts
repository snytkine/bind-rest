import HttpResponseCode from 'http-status-enum';
import { IResponseHeaders } from '../../types';
import AppResponse from './appresponse';
import { IResponseCookie } from '../../interfaces/responsecookie';

export default class ErrorResponse extends AppResponse {
  constructor(
    responseCode: HttpResponseCode,
    message: string = 'Internal Application Error',
    headers?: IResponseHeaders,
    public cookies?: Array<IResponseCookie>,
  ) {
    super(message, responseCode, headers, cookies);
  }
}
