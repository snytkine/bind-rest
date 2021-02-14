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
  body?: string;
  cookies?: Array<IResponseCookie>;
  readonly getReadStream: () => ReadableStream;
}

// export type IAppResponseMaybeBody = IAppResponse & { body?: string };
// export type IAppResponseMaybeJson = IAppResponseMaybeBody & { json?: any };

export type IAppResponseWithBody = Required<Omit<IAppResponse, 'cookies'>> & {cookies?: Array<IResponseCookie>}

export function isAppResponseWithBody(
  appResponse: IAppResponse,
): appResponse is IAppResponseWithBody {
  return appResponse.body !== undefined;
}

export interface IJsonResponse<T extends {}> extends IAppResponseWithBody {
  json: T;
}
