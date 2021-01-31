import http from 'http';
import https from 'https';
import { clearTimeout } from 'timers';
import util from 'util';
import uuid from 'uuid/v4';
import querystring from 'querystring';
import isStream from 'is-stream';
import { getHTTPSOverHTTPTunnel, getHTTPOverHTTPTunnel } from './tunnel';
import { IHttpRequestOptions, INormalizedRequestOptions } from '../interfaces';
import ApplicationError from '../errors/applicationerror';
import IncomingMessageResponse from '../httpresponse/IncomingMessageResponse';
import { IHttpIncomingMessageResponse } from '../interfaces/httpclientreponse';
import ResponseTimeoutError from '../errors/http/reponsetimeout';

const debug = require('debug')('bind:rest:request');

const REQUEST_ID = 'requestID';
const STATUS_CODE = 'statusCode';
const REQUEST_HOST = 'requestHost';
const REQUEST_URI = 'requestURI';
const TIMEOUT_VALUE = 'timeoutValue';
const REQUEST_ERROR = 'RequestError';
const REQUEST_METHOD = 'requestMethod';
const ELAPSED_TIME = 'elapsedTime';
const RESPONSE_HEADERS = 'responseHeaders';

const DEFAULT_TIMEOUT = 5000;
const TAG = 'makeRequest';

/* eslint-disable no-param-reassign */
export function setServiceOptions(options: IHttpRequestOptions): INormalizedRequestOptions {
  debug(TAG, 'Entered setServiceOptions with options: ', options);

  if (!options.requestID) {
    options.requestID = uuid();
  }

  if (!options.requestOptions.method) {
    debug(TAG, "Missing requestOptions.method  Setting default method 'GET'");
    options.requestOptions.method = 'GET';
  }

  if (options.basicAuth) {
    if (!options.requestOptions.headers) {
      options.requestOptions.headers = {};
    }

    options.requestOptions.headers.Authorization = `Basic ${Buffer.from(
      `${options.basicAuth.user}:${options.basicAuth.password}`,
      'utf8',
    ).toString('base64')}`;
    debug('%s Added AuthorizationHeader=%s', TAG, options.requestOptions.headers.Authorization);
  }

  if (
    options.RequestType === 'HTTPS' ||
    (options.requestOptions.protocol &&
      options.requestOptions.protocol.toLocaleLowerCase() === 'https:')
  ) {
    options.requestOptions.protocol = 'https:';
    debug(TAG, 'INSIDE HTTPS setServiceOptions with options: ', options);

    if (!options.requestOptions.port) {
      options.requestOptions.port = 443;
    }

    if (options.disableCertificateValidation === true) {
      options.requestOptions.rejectUnauthorized = false;

      debug(TAG, 'added rejectUnauthorized');
    }

    /*
     * Set tunneling agent if the endpoint requires a proxy otherwise use a regular https agent;
     */
    if (options.proxy) {
      debug('Will setup agent with https over proxy details');
      options.requestOptions.agent = getHTTPSOverHTTPTunnel(options);
    } else {
      debug(TAG, 'No PROXY in options. Setting up default agent');
      // @ts-ignore
      options.requestOptions.agent = new https.Agent(options.requestOptions);
    }
  } else {
    debug(TAG, 'Not HTTPS. Setting options.requestOptions.protocol to http');
    /*
     * Set tunneling agent if the endpoint requires a proxy otherwise use a regular https agent;
     */
    options.requestOptions.protocol = 'http:';
    if (options.proxy) {
      options.requestOptions.agent = getHTTPOverHTTPTunnel(options);
    } else {
      options.requestOptions.agent = false;
    }
  }

  if (options.requestOptions.port) {
    options.requestOptions.port = Number(options.requestOptions.port);
    if (Number.isNaN(options.requestOptions.port)) {
      throw new TypeError(
        `${TAG} value of options.requestOptions.port could not be converted to Number. Value was="${options.requestOptions.port}"`,
      );
    }

    debug(TAG, 'Port number set to=', options.requestOptions.port);
  }

  if (!options.requestOptions.hostname && options.requestOptions.host) {
    options.requestOptions.hostname = options.requestOptions.host;
  }

  if (options.requestOptions.query) {
    const queryString = querystring.stringify(options.requestOptions.query);
    /**
     * If path ends with ? then remove the ? from the end because
     * we going to add it manually
     * This is just a way to normalize path that has query string
     * in case someone passed the path like /mypath?
     */
    if (options.requestOptions.path.endsWith('?')) {
      options.requestOptions.path = options.requestOptions.path.slice(0, -1);
    }

    options.requestOptions.path = `${options.requestOptions.path}?${queryString}`;
  }

  return <INormalizedRequestOptions>options;
}

/*
 * Select the call type for request http || https.
 * If https create new agent.
 * This is necessary to pass any https keys like ca, key, cert, pfx etc as described here
 * https://nodejs.org/api/https.html#https_https_request_options_callback
 *
 * @todo what if we return Promise<Try<IHttpClientResponse>>? This would mean
 *   that Promise may resolve with Response object OR with Error
 * The upside is that Error may be a typed Error
 * Downside is that because its a promise it may still return rejected Promise
 */
export function makeRequest(
  requestOptions: IHttpRequestOptions,
): Promise<IHttpIncomingMessageResponse> {
  let ClientRequestorObject;
  let timeout = DEFAULT_TIMEOUT;
  let options: IHttpRequestOptions;
  try {
    options = setServiceOptions(requestOptions);
  } catch (e) {
    if (requestOptions.logger) {
      requestOptions.logger.error(TAG, 'Failed to setServiceOptions', e);
    }
    return Promise.reject(e);
  }

  debug('^^^^^ options after setServiceOptions: ', options);

  if (options.requestOptions.protocol === 'https:') {
    ClientRequestorObject = https;
    debug('@@@@@@@@@@@ USING HTTPS @@@@@@@@@@@@@');
  } else {
    ClientRequestorObject = http;
    debug('@@@@@@@@@@@ USING HTTP @@@@@@@@@@@@@');
  }

  let startTime;

  if (options.timeout) {
    timeout = Number(options.timeout);
    if (Number.isNaN(timeout)) {
      if (options.logger) {
        options.logger.error(
          TAG,
          `Value of options.timeout=${options.timeout} cannot be converted to number. Using default falue`,
        );
      }

      timeout = DEFAULT_TIMEOUT;
    }
  }

  const myport = options.requestOptions.port ? `:${options.requestOptions.port}` : '';
  const myuri = `${options.requestOptions.protocol}//${options.requestOptions.hostname}${myport}${options.requestOptions.path}`;

  return new Promise<IHttpIncomingMessageResponse>((resolve, reject) => {
    let request: http.ClientRequest;
    let resolved;
    let timeoutOccured = false;

    if (typeof options.payload === 'string') {
      const payloadLen = Buffer.byteLength(options.payload);
      debug('%s set payloadLen=%s', TAG, payloadLen);

      if (!options.requestOptions.headers) {
        options.requestOptions.headers = [];
      }
      options.requestOptions.headers['Content-Length'] = payloadLen;

      if (options.logger) {
        options.logger.debug(
          TAG,
          'payload is string. Method=',
          options.requestOptions.method,
          'headers=',
          options.requestOptions.headers,
        );
      }
    }

    /*
     * timeout is required as a manual timeout. https.setTimeout is a shortcut for socket.setTimout.
     * This describes the idle time of the socket not the length of time the request has been open without response.
     * This timeout is a hard stop for the time the function is open so a streamed request will not be open longer
     * than X amount of time. This is variable but defaults to 5000,s
     */
    const timeoutId = setTimeout(() => {
      timeoutOccured = true;
      try {
        if (request) {
          request.abort();
        }
      } catch (e) {
        /*
         * If request abort fails -> log
         */
        debug(TAG, ' Failed to abort request: %o', e);
        if (options.logger) {
          options.logger.error(
            `${TAG}=Failed to abort request. ${REQUEST_ID}=${options.requestID} ${REQUEST_ERROR}=`,
            e,
          );
        }
        /**
         *
         * if abort failed then reject this promise?
         */
      }
    }, timeout);

    // what we need at this point is this: options.requestOptions
    try {
      if (options.logger) {
        options.logger.info(
          `${TAG}=Start ${TIMEOUT_VALUE}=${timeout} milliseconds. ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
        );
        options.logger.debug(
          `${TAG}=Start ${REQUEST_ID}=${options.requestID} RequestHeaders:`,
          options.requestOptions.headers,
        );
      }

      startTime = Date.now();
      request = ClientRequestorObject.request(options.requestOptions);
      debug(TAG, ' Created request object');

      /*
       * If there is a connection error when trying to open the socket
       * This will catch any operational errors like 'NOENT'
       */
      request.on('error', (e) => {
        try {
          clearTimeout(timeoutId);
        } catch (ex) {
          if (options.logger) {
            options.logger.error(
              `${TAG}=clearTimeoutFailed on error for ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} error=${e.message} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
        }
        if (!timeoutOccured) {
          if (options.logger) {
            options.logger.error(
              `${TAG}=ErrorEvent ${REQUEST_ID}=${options.requestID}  ${REQUEST_HOST}=${options.requestOptions.hostname}" ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}="${options.requestOptions.method}" error=`,
              e,
            );
          }
          /**
           * @todo use HttpRequestError
           */
          reject(new Error(`There is an error in the get request ${util.inspect(e)}`));
        } else {
          debug(TAG, ' HTTP REQUEST ERROR ', e.message);
          if (options.logger) {
            options.logger.error(
              `${TAG}=ErrorEvent with timeout. ${REQUEST_ID}=${options.requestID}  ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}="${options.requestOptions.method}" error=`,
              e,
            );
          }
          /**
           * @todo timeoutOccured
           * in this case resolve with timeout http status code
           */
          if (!resolved) {
            reject(new Error(`HTTP Request error ${util.inspect(e)}`));
          } else {
            debug(TAG, ' Promise was already resolved');
            if (options.logger) {
              options.logger.debug(
                TAG,
                `error but already resolved. ${REQUEST_ID}=${options.requestID}  ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
              );
            }
          }
        }
      });

      /*
       * Handles the abort request by timeout
       */
      request.on('abort', () => {
        /**
         * If this abort was called from inside setTimeout function
         * then timeout is already cleared.
         * But if it was called from anywhere else then we need to clear timeout
         * to prevent timeout function calling the abort() again
         */
        try {
          clearTimeout(timeoutId);
        } catch (e) {
          if (options.logger) {
            options.logger.error(
              `${TAG}=clearTimeoutFailed on abort event for ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}="${options.requestOptions.method}" error=${e.message} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
        }

        debug(TAG, 'ON-ABORT CALLED');
        if (options.logger) {
          options.logger.debug(
            TAG,
            'request aborted for requestID=',
            options.requestID,
            ' REQUEST_HOST=',
            options.requestOptions.hostname,
            ' requestURI="',
            myuri,
            ' REQUEST_METHOD=',
            options.requestOptions.method,
            ' TIMEOUT_VALUE=',
            timeout,
            ' milliseconds',
          );
        }
        /**
         *
         * If timeoutOccurred then
         * resolve with timeout http status
         * log the value of request.aborted (should be value in milliseconds)
         * otherwise reject
         */
        if (timeoutOccured) {
          if (options.logger) {
            options.logger.debug(
              `${TAG}=debug resolving timed-out request. ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
          if (!resolved) {
            resolved = true;

            reject(
              new ResponseTimeoutError(
                `The request has taken longer than the allotted ${options.timeout} milliseconds`,
                options,
              ),
            );
          }
        } else {
          reject(new Error(`Http Request aborted`));
        }
      });

      /*
       * This is necessary to be able to resolve the type of response. Otherwise error messages are handled in the data of the Response
       * This fires one time;
       */
      request.on('response', (response: http.IncomingMessage) => {
        try {
          clearTimeout(timeoutId);
        } catch (ex) {
          if (options.logger) {
            options.logger.error(
              `${TAG}=clearTimeoutFailed for ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${REQUEST_ERROR}=${ex.message} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
        }

        if (options.logger) {
          options.logger.debug(
            `${TAG}=onresponse ${REQUEST_ID}=${options.requestID} ${STATUS_CODE}=${response.statusCode} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
          );
        }
        debug('%s onResponse called with statusCode=%s', TAG, response.statusCode);

        if (!resolved) {
          resolved = true;
          resolve(new IncomingMessageResponse(response, options.requestID));
        }
      });

      request.on('end', (response) => {
        debug('ON-END CALLED with response="%s"', !!response);
        if (options.logger) {
          options.logger.info(
            `${TAG}=end ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
          );
        }
      });

      request.on('upgrade', (response) => {
        debug('ON-UPGRADE CALLED with resonse="%s"', !!response);
        if (options.logger) {
          options.logger.info(
            `${TAG}=upgrade ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
          );
        }
      });

      let payloadPiped = false;

      if (options.requestOptions.method === 'POST' || options.requestOptions.method === 'PUT') {
        if (options.payload) {
          debug('%s Request method=%s has payload=%s', TAG, options.requestOptions.method);
          if (typeof options.payload === 'string') {
            debug(TAG, 'Request payload is a string: %s', options.payload);
            if (options.logger) {
              options.logger.debug(
                TAG,
                'Request payload is a string. Method=',
                options.requestOptions.method,
                options.requestOptions.headers,
              );
            }

            request.write(options.payload);
            debug(TAG, 'Written payload to request');
          } else {
            if (options.logger) {
              options.logger.debug(
                TAG,
                'Request payload is a stream=.',
                isStream.readable(options.payload),
                ' method=',
                options.requestOptions.method,
                options.requestOptions.headers,
              );
            }
            /**
             * @todo check that request is actually is stream.
             * Use some type of utility function that checks isStream
             */
            debug(TAG, 'Request payload is a stream');
            options.payload.pipe(request);
            payloadPiped = true;
          }
        } else {
          debug(TAG, 'NO payload in requestOptions');
        }
      }

      if (!payloadPiped) {
        debug(TAG, 'Calling request.end()');
        request.end();
      }
    } catch (ex) {
      if (options.logger) {
        options.logger.error(
          `${TAG}=Failed to create request object ${REQUEST_ID}=${options.requestID} ${REQUEST_ERROR}="${ex.message}"`,
        );
      }

      /**
       * @todo Do not use ApplicationError
       * Use only HttpRequestError
       */
      reject(new ApplicationError(`${TAG} request object ${REQUEST_ERROR}="${ex.message}"`));
    }
  })
    .then((resp) => {
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      debug(
        '%s Request completed for %s=%s %s=%s %s=%s',
        TAG,
        REQUEST_ID,
        options.requestID,
        ELAPSED_TIME,
        elapsedTime,
        STATUS_CODE,
        resp.statusCode,
      );

      if (options.logger) {
        options.logger.info(
          `${TAG}=OK Request complete. ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${STATUS_CODE}=${resp.statusCode} ${RESPONSE_HEADERS}=`,
          resp.headers,
          `${ELAPSED_TIME}=${elapsedTime} milliseconds`,
        );
      }

      return resp;
    })
    .catch((e) => {
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      debug(
        '%s Request FAILED for %s=%s %s=%s %s=%o',
        TAG,
        REQUEST_ID,
        options.requestID,
        ELAPSED_TIME,
        elapsedTime,
        REQUEST_ERROR,
        e,
      );
      if (options.logger) {
        options.logger.error(
          `${TAG}=Exception  ${REQUEST_ID}=${options.requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} Error="${e.message}" ${ELAPSED_TIME}=${elapsedTime} milliseconds. Exception=`,
          e,
        );
      }

      throw e;
    });
}
