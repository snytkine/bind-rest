import HttpStatusCode from 'http-status-enum';
import { IResponseCookie } from './responsecookie';
import { IResponseHeaders } from '../types/responseheaders';

import ReadableStream = NodeJS.ReadableStream;

/**
 * Controllers return a Promise of this interface
 */
export interface IAppResponse {
  statusCode: HttpStatusCode;
  headers: IResponseHeaders;
  cookies?: Array<IResponseCookie>;
  readonly getReadStream: () => ReadableStream;
}

export interface IJsonResponse<T extends {}> extends IAppResponse {
  json: T;
}
