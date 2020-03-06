const tunnel = require('tunnel');
const debug = require('debug')('promiseoft:httprequest');
import {IHttpRequestOptions} from "../"
/*
 * This code is not yet implemented. place holders
 */

export function getHTTPSOverHTTPTunnel(options: IHttpRequestOptions) {

  debug("ENTERED getHTTPSOverHTTPTunnel with ", options);

  let g = {

    maxSockets: options.poolSize || 10, // Defaults to 5

    proxy: { // Proxy settings
      host: options.proxy.proxyHost,
      port: options.proxy.proxyPort,
      headers: options.proxy.headers || {"User-Agent": "Promise-Of-T Browser"}
    }
  };

  if (options['ca']) {
    g['ca'] = options['ca']
  }

  if (options['key']) {
    g['key'] = options['key']
  }

  if (options['cert']) {
    g['cert'] = options['cert']
  }

  if (options.proxy.auth) {
    // Basic authorization for proxy server if necessary
    debug("Setting proxyAuth on tunnel to " + options.proxy.auth);
    g.proxy['proxyAuth'] = options.proxy.auth;
  }

  g['rejectUnauthorized'] = options.requestOptions.rejectUnauthorized;
  //g['secureProtocol'] = 'SSLv3_method';

  debug("HTTPS proxy options: ", g);

  try {
    let ret = tunnel.httpsOverHttp(g);

    debug("Returning tunnel object");

    return ret;

  } catch (ex) {
    debug("http tunnel exception. ex.message=%s", ex.message);
    throw new Error("Failed to create https tunnel object");
  }


}


export function getHTTPOverHTTPTunnel(options: IHttpRequestOptions) {
  debug("ENTERED getHTTPOverHTTPTunnel with proxyOptions ", options);

  let g = {
    maxSockets: options.poolSize || 10, // Defaults to 5
    proxy: { // Proxy settings
      host: options.proxy.proxyHost,
      port: options.proxy.proxyPort,
      headers: options.proxy.headers || {"User-Agent": "Promise-Of-T Browser"},
    }
  };

  if (options.proxy.auth) {
    // Basic authorization for proxy server if necessary
    g.proxy['proxyAuth'] = options.proxy.auth;
  }

  let tunnelingAgent = tunnel.httpOverHttp(g);

  return tunnelingAgent;
}

