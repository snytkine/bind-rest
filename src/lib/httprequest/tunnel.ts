import tunnel from 'tunnel';
import { StringToString } from 'bind';
import { IHttpRequestOptions } from '../interfaces';
// const tunnel = require('tunnel');
const debug = require('debug')('promiseoft:httprequest');

const TAG = 'TUNNEL';

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

export function getHTTPSOverHTTPTunnel(options: IHttpRequestOptions) {
  debug('%s ENTERED getHTTPSOverHTTPTunnel with ', TAG, options);

  const proxyOptions: ITunnelOptions = {
    maxSockets: options.poolSize || 10, // Defaults to 5
    proxy: {
      // Proxy settings
      host: options.proxy.proxyHost,
      port: options.proxy.proxyPort,
      headers: options.proxy.headers || { 'User-Agent': 'Promise-Of-T Browser' },
    },
  };

  if (options.ca) {
    proxyOptions.ca = options.ca;
  }

  if (options.key) {
    proxyOptions.key = options.key;
  }

  if (options.cert) {
    proxyOptions.cert = options.cert;
  }

  if (options.proxy.auth) {
    // Basic authorization for proxy server if necessary
    debug(`Setting proxyAuth on tunnel to ${options.proxy.auth}`);
    proxyOptions.proxy.proxyAuth = options.proxy.auth;
  }

  proxyOptions.rejectUnauthorized = options.requestOptions.rejectUnauthorized;
  // g['secureProtocol'] = 'SSLv3_method';

  debug('%s HTTPS proxy options: ', TAG, proxyOptions);

  try {
    const ret = tunnel.httpsOverHttp(proxyOptions);

    debug('Returning tunnel object');

    return ret;
  } catch (ex) {
    debug('http tunnel exception. ex.message=%s', ex.message);
    throw new Error('Failed to create https tunnel object');
  }
}

export function getHTTPOverHTTPTunnel(options: IHttpRequestOptions) {
  debug('ENTERED getHTTPOverHTTPTunnel with proxyOptions ', options);

  const proxyOptions: ITunnelOptions = {
    maxSockets: options.poolSize || 10, // Defaults to 5
    proxy: {
      // Proxy settings
      host: options.proxy.proxyHost,
      port: options.proxy.proxyPort,
      headers: options.proxy.headers || { 'User-Agent': 'Promise-Of-T Browser' },
    },
  };

  if (options.proxy.auth) {
    // Basic authorization for proxy server if necessary
    proxyOptions.proxy.proxyAuth = options.proxy.auth;
  }

  const tunnelingAgent = tunnel.httpOverHttp(proxyOptions);

  return tunnelingAgent;
}
