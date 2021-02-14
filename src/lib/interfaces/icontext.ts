import HttpStatusCode from 'http-status-enum';
import http from 'http';
import { ParsedUrlQuery } from 'querystring';
import HTTPMethod from 'http-method-enum';
import { ComponentScope, IScopedComponentStorage } from 'bind-di';
import { IUriParams } from 'holiday-router';
import { IContextStore } from '../types/contextstore';
import { IAppResponse } from './appresponse';

export interface IBindRestContext extends IScopedComponentStorage {
  contextType: string;
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
  querystring: string;
  parsedUrlQuery: ParsedUrlQuery;
  controllerArguments: Array<any>;
  parsedBody: any;
  appResponse?: IAppResponse;
  parsedCookies: { [key: string]: string };
  routeParams: IUriParams;
  // IScopedComponentStorage scope must be a REQUEST scope
  scope: ComponentScope.REQUEST;
}
