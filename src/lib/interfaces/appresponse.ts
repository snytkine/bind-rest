import HttpStatusCode from 'http-status-enum';
import { StringToString } from 'bind-di';

import ReadableStream = NodeJS.ReadableStream;
import { IncomingHttpHeaders } from 'http';
import ContentType from '../consts/contenttypes';


export interface IResponseHeaders<T extends string> extends IncomingHttpHeaders {
  ['content-type']: T;
}

/**
 * Controllers return a Promise of this interface
 */
export interface IAppResponse<T extends string> {
  statusCode: HttpStatusCode;
  headers: IResponseHeaders<T>;
  readonly getReadStream: () => ReadableStream;
}

export interface IJsonResponse<T> extends IAppResponse<ContentType.JSON> {
  jsonObj: T;
}
