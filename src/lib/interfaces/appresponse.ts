import HttpStatusCode from 'http-status-enum';
import { IResponseCookie } from './responsecookie';
import { IResponseHeaders } from '../types/responseheaders';

import ReadableStream = NodeJS.ReadableStream;

/**
 * Controllers return a Promise of this interface
 * This means that the response object of this type
 * must have all properties of IBase response and MAY have body property
 */
export interface IAppResponse {
  statusCode: HttpStatusCode;
  headers: IResponseHeaders;
  cookies?: Array<IResponseCookie>;
  readonly getReadStream: () => ReadableStream;
}

export type IAppResponseMaybeBody = IAppResponse & { body?: string };
export type IAppResponseMaybeJson = IAppResponseMaybeBody & { json?: any };

export interface IStringResponse extends IAppResponse {
  body: string;
}

export interface IJsonResponse<T extends {}> extends IStringResponse {
  json: T;
}
