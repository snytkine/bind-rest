import HttpResponseCode from 'http-status-enum';
import { ResponseHeaders } from '../../types';
import AppResponse from './appresponse';

export default class ErrorResponse extends AppResponse {
  constructor(
    responseCode: HttpResponseCode,
    message: string = 'Internal Application Error',
    readonly headers: ResponseHeaders = { 'content-type': 'text/plain' },
  ) {
    super(message, responseCode);
  }
}
