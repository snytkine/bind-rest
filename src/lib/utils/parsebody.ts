import * as http from 'http';
import inflate from 'inflation';
import raw from 'raw-body';
import { Validator } from 'jsonschema';
import SchemaValidationError from '../errors/validation/schemavalidationerror';
import Context from '../../components/context';

const debug = require('debug')('bind:rest:runtime:parseBody');

const TAG = 'PARSE-BODY';

/**
 * @todo instead of this use uncompress util becaues we already
 * using it in other place
 *
 * @todo also make sure to use charset from req header and pass it as option
 * for converting Buffer to string
 *
 * Convert incoming request into a string
 * @param req node's request http.IncomingMessage
 * @return Promise<string>
 */
export function parseBody(req: http.IncomingMessage): Promise<string> {
  const allowedMethods = ['PUT', 'POST'];
  if (!allowedMethods.includes(req.method)) {
    debug('%s bad request method for parseBody %s', TAG, req.method);
    throw new Error(`
  Error: Cannot extract Body from Request.
  Reason: request method "${req.method}" cannot include request body`);
  }

  const ret: Promise<string> = raw(inflate(req))
    .then((rawBody): string => {
      const res = String(rawBody);
      debug('%s returning rawBody as String %s', TAG, res);
      return res.valueOf();
    })
    .catch((e) => {
      debug('%s ERROR parsing body %o', TAG, e);
      return Promise.reject(e);
    });

  return ret;
}

/**
 * Convert incoming request into Json object
 * first converts it into string and then runs JSON.parse on it.
 *
 * @todo validate schema if schema is provided.
 *
 * @param req node's http.IncomingMessage
 * @param schema
 *
 * @todo use uncompressResponse then stringifyBody then JSON.parse
 *
 * @return Promise<Object>
 */
export function parseJsonBody(ctx: Context, schema?: Object): Promise<Object> {
  debug('%s Entered parseJsonBody', TAG);
  if (ctx.parsedBody) {
    debug('%s returning cached parsedBody %o', TAG, ctx.parsedBody);
    return Promise.resolve(ctx.parsedBody);
  }
  return parseBody(ctx.req)
    .then((body) => {
      const ret = JSON.parse(body);
      debug('%s parsed body as json %o', TAG, ret);

      return ret;
    })
    .then((obj) => {
      let validator: Validator;
      if (schema) {
        debug('%s have schema to validate', TAG);
        validator = new Validator();
        const res = validator.validate(obj, schema, { propertyName: 'Object' });
        if (!res.valid) {
          debug('%s Failed to validate schema', TAG);
          throw new SchemaValidationError(`Schema Validation Error="${res.toString()}"`);
        }
      }

      Reflect.set(ctx, 'parsedBody', obj);

      return obj;
    });
}
