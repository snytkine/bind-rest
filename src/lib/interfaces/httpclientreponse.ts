import http from 'http';
import { IAppResponse } from './appresponse';

export interface IHttpClientResponse extends IAppResponse {
  requestID: string;
}

export interface IHttpIncomingMessageResponse extends IHttpClientResponse {
  readonly getReadStream: () => http.IncomingMessage;
}
