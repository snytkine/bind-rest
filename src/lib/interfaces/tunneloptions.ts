import { StringToString } from 'bind';

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
