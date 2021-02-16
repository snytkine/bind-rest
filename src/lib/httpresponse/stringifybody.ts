import charSet from 'charset';
import SUPPORTED_ENCODINGS from '../consts/supportedencodings';
import { IAppResponse, IAppResponseWithBody, isAppResponseWithBody } from '../interfaces';
import { AppResponse } from '../core';
import HTTP_BODY_MAX_BYTES from '../consts/maxhttpbodysize';
import HEADER_NAMES from '../consts/headernames';

const debug = require('debug')('bind:rest:httprequest');

const TAG = 'STRINGIFY_BODY';

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
 * there is a separate uncompressResponse function that should be run before this one.
 * ex: getHttpResponseSomehow (usually with makeRequest) .then(decompressResponse).then(stringifyBody)
 * .then(jsonParseBody)
 *
 * @TODO must be a limit for the max size of body. The limit can be set as environment var like BIND_REST_MAX_RESPONSE_BODY
 * or instead of env var the function can be a curry function - take in the maxSize and return this function.
 * ex: .then(stringifyBody(1000000)).then(jsonParseBody)
 *
 * @param resp: IAppResponse
 * @returns {Promise<IAppResponseWithBody>}
 */
const stringifyBody = (maxBytes: number = HTTP_BODY_MAX_BYTES) => (
  resp: Omit<IAppResponse, 'cookies'>,
): Promise<IAppResponseWithBody> => {
  if (isAppResponseWithBody(resp)) {
    debug('%s response already has body %s', TAG, resp.body);
    return Promise.resolve(resp);
  }

  const is = resp.getReadStream();
  let bytesRead: number = 0;

  const bufs: Buffer[] = [];

  /**
   * @todo if content-type is determined to be a binary content
   * then we should not even attempt to stringify it
   * instead should throw Error here.
   */

  /**
   * Response may be in compressed format.
   * Important to first uncompress the response
   * Default will be utf-8
   * In case we cannot determine actual charset this default value can cause problem
   * For example if content-type is binary then we will have problem stringifying it.
   */
  let cs: string = 'utf-8';

  /**
   * Determine content-type
   */
  if (resp.headers && resp.headers[HEADER_NAMES.CONTENT_TYPE]) {
    debug('Have content-type header in response: %s', resp.headers[HEADER_NAMES.CONTENT_TYPE]);
    cs = charSet(resp.headers[HEADER_NAMES.CONTENT_TYPE]);
    cs = cs && cs.toLocaleLowerCase();
    debug(`Charset from response: %s`, cs);
    /**
     * Node.js stream supports latin1 but not iso-8859-1 (these are the same, but node.js only
     * supports it by 'latin1' name
     * win-1252 is not supported
     *
     * From official Node 12 doc:
     * Valid string encodings in Node 0.12: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'binary'(deprecated)|'hex'
     */
    if (cs === 'iso-8859-1' || cs === 'iso8859-1' || cs === 'latin-1' || cs === 'iso88591') {
      debug('Changed charset to latin1');
      cs = 'latin1';
    }
  }

  if (cs) {
    if (!SUPPORTED_ENCODINGS.includes(cs)) {
      debug('Unknown encoding: ', cs);
      /**
       *
       */
    } else {
      /**
       * This is where charset encoding is set for the whole stream
       * if it is set then chunks of data will be string, otherwise it will be Buffer
       */
      // is.setEncoding(cs);
    }
  }

  return new Promise(function stringifyBodyResolver(resolve, reject) {
    is.on('data', function stringifyBodyOnData(data: Buffer) {
      // str += data.toString();
      bytesRead += data.byteLength;
      if (bytesRead > maxBytes) {
        const maxSizeError = `Body is larger than maximum allowed size of ${maxBytes} bytes`;
        debug('%s %s', TAG, maxSizeError);
        // @ts-ignore
        if (is.destroy && typeof is.destroy === 'function') {
          debug('%s calling destroy() method', TAG);
          // @ts-ignore
          is.destroy(maxSizeError);
        } else {
          debug('%s read stream does not have destroy() function.', TAG);
          reject(new Error(maxSizeError));
          is.removeAllListeners();
        }
      } else {
        bufs.push(data);
      }
    });
    is.on('end', function stringifyBodyOnEnd() {
      debug('%s onEnd called. Total chunks=%s', TAG, bufs.length);
      const finalBuffer = Buffer.concat(bufs);
      debug(
        '%s finalBuffer bytes=%s  Calling toString with encoding=%s',
        TAG,
        finalBuffer.byteLength,
        cs,
      );
      const str = finalBuffer.toString(cs);
      resolve(new AppResponse(str, resp.statusCode, resp.headers));
    });
    is.on('error', function stringifyBodyOnError(err) {
      reject(err);
    });
  });
};

export default stringifyBody;
