import HttpResponseCode from 'http-status-enum';
import AppResponse from './appresponse';
import { IResponseHeaders } from '../../interfaces';
import ContentType from '../../consts/contenttypes';

export default class ErrorResponse extends AppResponse {
  constructor(
    responseCode: HttpResponseCode = HttpResponseCode.INTERNAL_SERVER_ERROR,
    message: string = 'Application Error',
    headers: IResponseHeaders<ContentType.PLAIN_TEXT> = { 'content-type': ContentType.PLAIN_TEXT },
  ) {
    super(message, responseCode, headers);
  }
}
