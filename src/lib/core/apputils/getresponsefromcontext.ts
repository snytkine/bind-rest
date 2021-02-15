import HttpResponseCode from 'http-status-enum';
import { Maybe } from 'bind-di';
import Cookies from 'cookies';
import {
  IAppResponse,
  IBindRestContext,
  isAppResponseWithBody,
  IServerResponse,
} from '../../interfaces';
import { ErrorResponse } from '../appresponse';
import { HEADER_NAMES } from '../../consts';
import getByteLength from '../../utils/bytelength';
import ApplicationError from '../../errors/applicationerror';
import { IResponseHeaders } from '../../types/responseheaders';

const debug = require('debug')('bind:rest:runtime:application');

const TAG = 'GET_RESPONSE_FROM_CONTEXT';

/**
 * Convert cookies object from IAppResponse into
 * an array of string values that can be used for setting cookie
 * with set-cookie header
 *
 * @throws the Cookies library may throw in case if there are any invalid cookie names, values or options.
 *
 * @param cookies
 */
const toStringCookies = (appResponse: IAppResponse): Maybe<string[]> => {
  const { cookies } = appResponse;
  const { headers } = appResponse;
  let ret: string[];
  if (cookies) {
    ret = Object.entries(cookies).map(([key, val]) => {
      return new Cookies.Cookie(key, val.value, val.options).toHeader();
    });
  }

  /**
   * If response headers include set-cookie then
   */
  if (headers && headers[HEADER_NAMES.SET_COOKIE]) {
    ret = ret || [];
    ret = ret.concat(headers[HEADER_NAMES.SET_COOKIE]);
  }

  return ret;
};

const filterStringOnlyHeaders = (headers: IResponseHeaders): NodeJS.Dict<string> => {
  const entries = Object.entries(headers);

  const ret = entries.reduce((acc, next) => {
    const [key, val] = next;
    if (!Array.isArray(val)) {
      acc[key] = `${val};`;
    } else {
      debug('%s Removing header % because its a multi-value', TAG, key);
    }

    return acc;
  }, {});

  return ret;
};

/**
 * @throws ApplicationError
 * @param context
 */
const getResponseFromContext = (context: IBindRestContext): IServerResponse => {
  const response =
    context.appResponse ||
    new ErrorResponse(HttpResponseCode.INTERNAL_SERVER_ERROR, 'Response not processed');
  let responseCookies: string[];

  try {
    responseCookies = toStringCookies(response);
  } catch (e) {
    throw new ApplicationError('Error processing response cookies', e);
  }

  const ret: IServerResponse = {
    statusCode: response.statusCode,
    headers: filterStringOnlyHeaders(response.headers),
    cookies: responseCookies,
    getReadStream: response.getReadStream.bind(response),
  };

  /**
   * IAppResponseWithBody are special. set content-length header
   */
  if (isAppResponseWithBody(ret)) {
    ret.headers[HEADER_NAMES.CONTENT_LENGTH] = `${getByteLength(response.body)}`;
    ret.body = response.body;
  }

  return ret;
};

export { toStringCookies, getResponseFromContext, filterStringOnlyHeaders };
