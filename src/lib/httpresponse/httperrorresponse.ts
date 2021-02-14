import AppResponse from '../core/appresponse/appresponse';
import { IHttpClientResponse } from '../interfaces/httpclientreponse';

export default class HttpErrorResponse extends AppResponse implements IHttpClientResponse {
  constructor(
    statusCode: number,
    error: string = '',
    headers: { [key: string]: any } = {},
    public requestID: string,
  ) {
    super(error, statusCode, headers);
  }
}
