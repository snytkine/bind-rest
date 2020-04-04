import http from 'http';
import { ILogger } from './logger';

export interface IProxyOptions {
  proxyHost: string;
  proxyPort: string;
  auth?: string;
  headers?: any;
}

export interface UserPassword {
  user: string;
  password: string;
}

export interface IRequestOptions {
  protocol?: string;
  host?: string;
  hostname?: string;
  family?: number;
  port?: string | number;
  localAddress?: string;
  socketPath?: string;
  method?: string;
  path?: string;
  query?: { [key: string]: string | number };
  headers?: { [key: string]: any };
  auth?: string;
  agent?: http.Agent | boolean;
  rejectUnauthorized?: boolean;
}

export interface IHttpRequestOptions {
  timeout?: string | number;
  requestOptions: IRequestOptions;
  payload?: string | NodeJS.ReadableStream;
  proxy?: IProxyOptions;
  disableCertificateValidation?: boolean;
  ca?: string;
  key?: string;
  cert?: string;
  poolSize?: number;
  RequestType?: 'HTTPS' | 'HTTP';
  basicAuth?: UserPassword;
  logger?: ILogger;
}

export interface INormalizedRequestOptions {
  timeout?: string | number;
  requestOptions: http.RequestOptions;
  payload?: string | NodeJS.ReadableStream;
  proxy?: IProxyOptions;
  disableCertificateValidation?: boolean;
  ca?: string;
  key?: string;
  cert?: string;
  poolSize?: number;
  RequestType?: 'HTTPS' | 'HTTP';
  basicAuth?: UserPassword;
  logger?: ILogger;
}
