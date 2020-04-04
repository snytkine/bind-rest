import HTTPMethod from 'http-method-enum';
import { stringToHttpMethod } from '../../types';

const httpMethodsMap: stringToHttpMethod = {
  GET: HTTPMethod.GET,
  POST: HTTPMethod.POST,
  CONNECT: HTTPMethod.CONNECT,
  DELETE: HTTPMethod.DELETE,
  HEAD: HTTPMethod.HEAD,
  OPTIONS: HTTPMethod.OPTIONS,
  PATCH: HTTPMethod.PATCH,
  PUT: HTTPMethod.PUT,
  TRACE: HTTPMethod.TRACE,
};

const toHTTPMethod = (method: string): HTTPMethod => {
  const ret: unknown = httpMethodsMap[method] || 'UNSUPPORTED_METHOD';

  return ret as HTTPMethod;
};

export { httpMethodsMap, toHTTPMethod };
