import HttpStatusCode from 'http-status-enum';
import http from 'http';
import { UrlWithStringQuery } from 'url';
import { ParsedUrlQuery } from 'querystring';
import HTTPMethod from 'http-method-enum';
import { ComponentScope, IScopedComponentStorage } from 'bind-di';
import { IUriParams } from 'holiday-router';
import { IAppResponseMaybeJson } from './appresponse';
import { IContextStore } from '../types/contextstore';

export interface IBindRestContext extends IScopedComponentStorage {
  startTime: number;
  setHeader(key: string, value: string): void;
  setStatusCode(statusCode: HttpStatusCode): void;
  storage: IContextStore;
  req: http.IncomingMessage;
  requestMethod: HTTPMethod;
  requestHeaders: http.IncomingHttpHeaders;
  requestBody?: string;
  requestUrl: string;
  controllerName: string;
  path: string | null;
  parsedUrl: UrlWithStringQuery;
  querystring: string;
  parsedUrlQuery: ParsedUrlQuery;
  controllerArguments: Array<any>;
  parsedBody: any;
  appResponse?: IAppResponseMaybeJson;
  parsedCookies: { [key: string]: string };
  routeParams: IUriParams;
  // IScopedComponentStorage scope must be a REQUEST scope
  scope: ComponentScope.REQUEST;
}
