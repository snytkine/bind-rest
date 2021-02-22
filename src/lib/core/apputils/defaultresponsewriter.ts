import Http from 'http';
import { IfIocContainer } from 'bind-di';
import { IServerResponse, WriteServerResponseFunc } from '../../interfaces';
import HeaderNames from '../../consts/headernames';

const debug = require('debug')('bind:rest:runtime:responsewriter');

const TAG = 'DEFAULT_RESPONSE_WRITER';

const defaultResponseWriter: WriteServerResponseFunc = (
  serverResponse: IServerResponse,
  res: Http.ServerResponse,
) => {
  if (res.writableFinished) {
    debug('%s response already sent. Skipping responseWriter middleware', TAG);

    return undefined;
  }

  res.on('finished', () => debug('%s res onFinished', TAG));
  res.on('end', () => debug('%s res onEnd called', TAG));
  res.on('close', () => debug('%s res onClosed', TAG));
  res.on('error', (error) => debug('%s res onError error=%o', TAG, error));

  if (serverResponse.statusCode) {
    res.statusCode = serverResponse.statusCode;
  }
  if (res.headersSent) {
    debug('%s headers already sent.', TAG);
  } else {
    if (serverResponse.headers) {
      for (const [key, value] of Object.entries(serverResponse.headers)) {
        try {
          res.setHeader(key, value);
        } catch (e) {
          debug('%s error setting response header "%s" error="%s"', TAG, key, value);
        }
      }
    }

    if (serverResponse.cookies && serverResponse.cookies.length > 0) {
      debug('%s serverResponse has %s cookie ', TAG, serverResponse.cookies.length);
      serverResponse.cookies.forEach((cookie) => {
        debug('%s Setting set-cookie with %s', TAG, cookie);
        try {
          res.setHeader(HeaderNames.SET_COOKIE, cookie);
        } catch (e) {
          debug('%s error setting cookie "%s" error="%s"', TAG, cookie, e);
        }
      });
    } else {
      debug('%s serverResponse does not have cookies', TAG);
    }
  }

  if (serverResponse.body) {
    debug('%s serverResponse has body', TAG);
    res.end(serverResponse.body);
  } else {
    serverResponse.getReadStream().pipe(res);
  }

  return undefined;
};

const getResponseWriter = (cntr: IfIocContainer): WriteServerResponseFunc => {
  /**
   * @todo in the future look for special type of component that can be identified as responsewriter
   * and if found then convert it into a function that implements WriteServerResponseFunc
   * and return that function.
   */
  debug('%s entered getResponseWriter. %s', TAG, cntr);
  return defaultResponseWriter;
};

export { defaultResponseWriter, getResponseWriter };
