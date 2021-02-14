import * as Http from 'http';
import { IAppResponse, WriteServerResponseFunc } from '../../interfaces';

const debug = require('debug')('bind:rest:runtime:responsewriter');

const TAG = 'DEFAULT_RESPONSE_WRITER';

const defaultResponseWriter: WriteServerResponseFunc = (
  appResponse: IAppResponse,
  res: Http.ServerResponse,
) => {
  if (res.writableFinished) {
    debug('%s response already sent. Skipping responseWriter middleware', TAG);

    return undefined;
  }

  res.on('finished', () => debug('%s res onFinished', TAG));
  res.on('end', () => debug('%s res onEnd', TAG));
  res.on('close', () => debug('%s res onClosed', TAG));
  res.on('error', (error) => debug('%s res onError error=%o', TAG, error));

  if (appResponse.statusCode) {
    res.statusCode = appResponse.statusCode;
  }
  if (res.headersSent) {
    debug('%s headers already sent', TAG);
  } else if (appResponse.headers) {
    for (const [key, value] of Object.entries(appResponse.headers)) {
      try {
        res.setHeader(key, value);
      } catch (e) {
        debug('%s error setting response header "%s" error="%s"', TAG, key, value);
      }
    }
  }

  if (appResponse.body) {
    res.end(appResponse.body);
  } else {
    appResponse.getReadStream().pipe(res);
  }

  return undefined;
};

export default defaultResponseWriter;
