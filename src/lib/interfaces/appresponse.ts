import HttpStatusCode from 'http-status-enum';
import http from 'http';
import { IResponseCookieValue } from './responsecookie';
import { SYM_HAS_BODY } from '../consts/appcomponents';

import ReadableStream = NodeJS.ReadableStream;

const debug = require('debug')('bind:rest:runtime:application');

const TAG = 'APP_RESPONSE';

/**
 * Controllers return a Promise of this interface
 * This means that the response object of this type
 * must have all properties of IBase response and MAY have body property
 */
export interface IAppResponse {
  statusCode: HttpStatusCode;
  headers: http.IncomingHttpHeaders;
  body?: string;
  cookies?: NodeJS.Dict<IResponseCookieValue>;
  readonly getReadStream: () => ReadableStream;
}

export type IAppResponseWithBody = Required<Omit<IAppResponse, 'cookies'>> & {
  cookies?: NodeJS.Dict<IResponseCookieValue>;
};

export function isAppResponseWithBody(
  appResponse: Omit<IAppResponse, 'cookies'>,
): appResponse is IAppResponseWithBody {
  const hasBodyFlag = Reflect.has(appResponse, SYM_HAS_BODY);
  /**
   * checking for undefined instead of truethy because empty string still counts as body
   */
  const ret = hasBodyFlag || appResponse.body !== undefined;
  debug('%s returning from isAppResponseWithBody=%s hasBodyFlag=%s', TAG, ret, hasBodyFlag);
  return ret;
}

export interface IJsonResponse<T extends {}> extends IAppResponseWithBody {
  json: T;
}

/**
 * This interface is suitable for returning to Lambda function,
 * or any type of serverless cloud service.
 * This is what is returned by Application.getAppResponse()
 * it does not guarantee that response will have a body (string)
 * but it guarantees that it will have a way to get readable stream from it.
 * Also cookies is an array of strings that are in format of cookie
 * example: "mycookie=myvalue; secure; HttpOnly; path=/" this is a format that
 * can be used for sending a set-cookie header.
 * set-cookie header will be set for each of these strings.
 * AWS Lambda will just handle this array and will send cookies in response.
 */
export interface IServerResponse {
  statusCode: HttpStatusCode;
  headers: NodeJS.Dict<string>;
  body?: string;
  cookies?: string[];
  readonly getReadStream: () => ReadableStream;
}
