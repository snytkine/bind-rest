import HttpResponse from './httpresponse';
import HttpStringResponse from './stringresponse';
import getCharset from '../utils/getcharset';
import { Maybe } from 'bind-di';

const debug = require('debug')('bind:rest:httprequest');

/**
 * Function to convert stream in the Http Response into string body
 * This function can be used at a .then function to transform
 * Promise<HttpResponse> into Promise<HttpStringResponse>
 * Such transformation is necessary if the body of http response has to be parsed as JSON
 * because response body must first be turned into a string before JSON.parse can be called on the body
 *
 * Example promiseHttpResponse.then(stringifyBody).then(resp => JSON.parse(resp.body))
 *
 * @param resp: HttpResponse
 * @returns {Promise<HttpStringResponse>}
 */
export default function stringifyBody(resp: HttpResponse): Promise<HttpStringResponse> {
  const is = resp.getReadStream();
  let cs: Maybe<string> = getCharset(resp.headers);

  if (cs) {
    debug('stringifyBody setEncoding="%s"', cs);
    is.setEncoding(cs);
  } else {
    debug('stringifyBody charset UNKNOWN');
  }

  return new Promise(function stringifyResolver(resolve, reject) {
    let str = '';
    is.on('data', function stringifyBodyOnData(data) {
      str += data.toString();
    });
    is.on('end', function stringifyBodyOnEnd() {
      resolve(new HttpStringResponse(str, resp.statusCode, resp.headers));
    });
    is.on('error', function stringifyBodyOnError(err) {
      reject(err);
    });
  });
}
