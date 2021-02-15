import Http from 'http';
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

    if (serverResponse.cookies) {
      serverResponse.cookies.forEach((cookie) => {
        debug('%s Setting set-cookie with %s', TAG, cookie);
        try {
          res.setHeader(HeaderNames.SET_COOKIE, cookie);
        } catch (e) {
          debug('%s error setting cookie "%s" error="%s"', TAG, cookie, e);
        }
      });
    }
  }

  if (serverResponse.body) {
    res.end(serverResponse.body);
  } else {
    serverResponse.getReadStream().pipe(res);
  }

  return undefined;
};

export default defaultResponseWriter;
