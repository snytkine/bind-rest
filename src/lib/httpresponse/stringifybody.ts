import charSet from 'charset';
import SUPPORTED_ENCODINGS from '../consts/supportedencodings';
import HttpResponse from './httpresponse';
import HttpStringResponse from './stringresponse';
import decompressResponse from 'decompress-response';
import * as http from "http";
import {IAppResponse} from "../interfaces";

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
 * @TODO response stream may be gzip encoded (this is common for http responses)
 * We need to convert this readable stream into uncompressed stream first.
 *
 * @param resp: HttpResponse
 * @returns {Promise<HttpStringResponse>}
 */
export default function stringifyBody(resp: IAppResponse): Promise<HttpStringResponse> {
  const is = resp.getReadStream();

  /**
   * Response may be in compressed format.
   * Important to first uncompress the response
   */
  let cs: string;

  /**
   * Determine content-type
   */
  if (resp.headers && resp.headers['content-type']) {
    debug('Have content-type header in response: %s', resp.headers['content-type']);
    cs = charSet(resp.headers['content-type']);
    cs = cs && cs.toLocaleLowerCase();
    debug(`Charset from response: %s`, cs);
    /**
     * Node.js stream supports latin1 but not iso-8859-1 (these are the same, but node.js only
     * supports it by 'latin1' name
     * win-1252 is not supported
     */
    if (cs === 'iso-8859-1' || cs === 'iso8859-1' || cs === 'latin-1' || cs === 'iso88591') {
      debug('Changed charset to latin1');
      cs = 'latin1';
    }
  }

  if (cs) {
    if (!SUPPORTED_ENCODINGS.includes(cs)) {
      debug('Unknown encoding: ', cs);
    } else {
      is.setEncoding(cs);
    }
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
