import http from 'http';
import https from 'https';
import { clearTimeout } from 'timers';
import util from 'util';
import uuid from 'uuid/v4';
import HttpStatusCode from 'http-status-enum';
import stream from 'stream';
import querystring from 'querystring';
import isStream from 'is-stream';
import { ILogger } from '../interfaces/logger';
import { HttpResponse, HttpErrorResponse, stringifyBody } from '../httpresponse';
import { getHTTPSOverHTTPTunnel, getHTTPOverHTTPTunnel } from './tunnel';
import { IHttpRequestOptions, INormalizedRequestOptions } from '../interfaces';
import ApplicationError from '../errors/applicationerror';

const debug = require('debug')('bind:rest:request');

const REQUEST_ID = 'requestID';
const STATUS_CODE = 'statusCode';
const REQUEST_HOST = 'requestHost';
const REQUEST_URI = 'requestURI';
const TIMEOUT_VALUE = 'timeoutValue';
const REQUEST_ERROR = 'RequestError';
const RESPONSE_ERROR = 'responseError';
const REQUEST_METHOD = 'requestMethod';
const ELAPSED_TIME = 'elapsedTime';
const RESPONSE_HEADERS = 'responseHeaders';

const DEFAULT_TIMEOUT = 5000;
const TAG = 'makeRequest';

/**
 * Wrapper helper function to create custom
 * version of Logger that has instance of headers
 * available to logging calls, so there is no need
 * to pass headers as last param to every logging calls
 *
 * @param {ILogger} logger
 * @param {Object} headers
 * @returns {ILogger}
 */
export function requestLogger(logger: ILogger, headers: http.IncomingHttpHeaders): ILogger {
  const reqLogger = {
    info(...messages: any[]): ILogger {
      logger.info(...messages, headers);
      return this;
    },

    error(...messages: any[]): ILogger {
      logger.error(...messages, headers);
      return this;
    },

    warn(...messages: any[]): ILogger {
      logger.warn(...messages, headers);
      return this;
    },

    debug(...messages: any[]): ILogger {
      logger.debug(...messages, headers);
      return this;
    },

    fatal(...messages: any[]): ILogger {
      logger.fatal(...messages, headers);
      return this;
    },
  };

  return reqLogger;
}

/* eslint-disable no-param-reassign */
function setServiceOptions(options: IHttpRequestOptions): INormalizedRequestOptions {
  debug(TAG, 'Entered setServiceOptions with options: ', options);

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
    options.requestOptions.headers.cookie = 'jive.user.loggedIn=true';
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
 */
export function makeRequest(options: IHttpRequestOptions): Promise<HttpResponse> {
  let ClientRequestorObject;
  let timeout = DEFAULT_TIMEOUT;

  try {
    options = setServiceOptions(options);
  } catch (e) {
    if (options.logger) {
      options.logger.error(TAG, 'Failed to setServiceOptions', e);
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

  const requestID = uuid();
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

  return new Promise<HttpResponse>((resolve, reject) => {
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
        /*
         * If timeout is reached ty to abort request and close socket
         */
        if (options.logger) {
          options.logger.error(
            `${TAG}=TimeoutReached for ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
          );
        }
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
            `${TAG}=Failed to abort request. ${REQUEST_ID}=${requestID} ${REQUEST_ERROR}=`,
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
          `${TAG}=Start ${TIMEOUT_VALUE}=${timeout} milliseconds. ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
        );
        options.logger.debug(
          `${TAG}=Start ${REQUEST_ID}=${requestID} RequestHeaders:`,
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
              `${TAG}=clearTimeoutFailed on error for ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} error=${e.message} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
        }
        if (!timeoutOccured) {
          if (options.logger) {
            options.logger.error(
              `${TAG}=ErrorEvent ${REQUEST_ID}=${requestID}  ${REQUEST_HOST}=${options.requestOptions.hostname}" ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}="${options.requestOptions.method}" error=`,
              e,
            );
          }

          reject(new Error(`There is an error in the get request ${util.inspect(e)}`));
        } else {
          debug(TAG, ' HTTP REQUEST ERROR ', e.message);
          if (options.logger) {
            options.logger.error(
              `${TAG}=ErrorEvent with timeout. ${REQUEST_ID}=${requestID}  ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}="${options.requestOptions.method}" error=`,
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
                `error but already resolved. ${REQUEST_ID}=${requestID}  ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
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
              `${TAG}=clearTimeoutFailed on abort event for ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}="${options.requestOptions.method}" error=${e.message} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
        }

        debug(TAG, 'ON-ABORT CALLED');
        if (options.logger) {
          options.logger.debug(
            TAG,
            'request aborted for requestID=',
            requestID,
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
         * If timeoutOccured then
         * resolve with timeout http status
         * log the value of request.aborted (should be value in milliseconds)
         * otherwise reject
         */
        if (timeoutOccured) {
          if (options.logger) {
            options.logger.debug(
              `${TAG}=debug resolving timed-out request. ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
          if (!resolved) {
            resolved = true;
            resolve(
              new HttpErrorResponse(
                HttpStatusCode.GATEWAY_TIMEOUT,
                `The request has taken longer than the allotted ${options.timeout} milliseconds`,
                {},
                requestID,
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
              `${TAG}=clearTimeoutFailed for ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${REQUEST_ERROR}=${ex.message} ${TIMEOUT_VALUE}=${timeout} milliseconds`,
            );
          }
        }

        if (options.logger) {
          options.logger.debug(
            `${TAG}=onresponse ${REQUEST_ID}=${requestID} ${STATUS_CODE}=${response.statusCode} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
          );
        }
        debug('%s onResponse called with statusCode=%s', TAG, response.statusCode);

        if (!resolved) {
          resolved = true;
          resolve(new HttpResponse(response.statusCode, response.headers, response, requestID));
        }
      });

      request.on('end', (response) => {
        debug('ON-END CALLED with response="%s"', !!response);
        if (options.logger) {
          options.logger.info(
            `${TAG}=end ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
          );
        }
      });

      request.on('upgrade', (response) => {
        debug('ON-UPGRADE CALLED with resonse="%s"', !!response);
        if (options.logger) {
          options.logger.info(
            `${TAG}=upgrade ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method}`,
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
          `${TAG}=Failed to create request object ${REQUEST_ID}=${requestID} ${REQUEST_ERROR}="${ex.message}"`,
        );
      }

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
        requestID,
        ELAPSED_TIME,
        elapsedTime,
        STATUS_CODE,
        resp.statusCode,
      );

      if (options.logger) {
        /**
         * Automatically log response body of error responses
         */
        if (resp.statusCode >= 400) {
          /**
           * Also log response headers
           */
          options.logger.error(
            `${TAG}=HttpErrorResponse. ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${STATUS_CODE}=${resp.statusCode} ${ELAPSED_TIME}=${elapsedTime} milliseconds. ${RESPONSE_HEADERS}=`,
            resp.headers,
          );
          return stringifyBody(resp).then((sresp) => {
            const errorBody = sresp.body;
            options.logger.error(
              `${TAG}=HttpErrorResponse. ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${STATUS_CODE}=${resp.statusCode} ${ELAPSED_TIME}=${elapsedTime} milliseconds. ${RESPONSE_ERROR}=${errorBody}`,
            );
            // Now we have stringBody response
            // we need to convert it back to readable stream so we can return correct type
            const bufferStream = new stream.PassThrough();
            bufferStream.end(errorBody);

            return new HttpResponse(resp.statusCode, resp.headers, bufferStream, resp.requestID);
          });
        }
        options.logger.info(
          `${TAG}=OK Request complete. ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} ${STATUS_CODE}=${resp.statusCode} ${RESPONSE_HEADERS}=`,
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
        requestID,
        ELAPSED_TIME,
        elapsedTime,
        REQUEST_ERROR,
        e,
      );
      if (options.logger) {
        options.logger.error(
          `${TAG}=Exception  ${REQUEST_ID}=${requestID} ${REQUEST_HOST}=${options.requestOptions.hostname} ${REQUEST_URI}="${myuri}" ${REQUEST_METHOD}=${options.requestOptions.method} Error="${e.message}" ${ELAPSED_TIME}=${elapsedTime} milliseconds. Exception=`,
          e,
        );
      }

      throw e;
    });
}
