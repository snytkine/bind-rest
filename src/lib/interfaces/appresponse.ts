import HttpStatusCode from 'http-status-enum';

import ReadableStream = NodeJS.ReadableStream;

/**
 * Controllers return a Promise of this interface
 */
export interface IAppResponse {
  statusCode: HttpStatusCode;
  headers: { [key: string]: string };
  readonly getReadStream: () => ReadableStream;
}

export interface IJsonResponse<T> extends IAppResponse {
  jsonObj: T;
}
