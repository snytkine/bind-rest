import { StringToString } from 'bind-di';

export interface ITunnelProxy {
  host: string;
  port: string;
  headers: StringToString;
  proxyAuth?: string;
}

export interface ITunnelOptions {
  maxSockets: string | number;
  proxy: ITunnelProxy;
  ca?: string;
  key?: string;
  cert?: string;
  rejectUnauthorized?: boolean;
}
