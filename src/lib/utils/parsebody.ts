import * as http from 'http';
import inflate from 'inflation';
import raw from 'raw-body';
import { Validator } from 'jsonschema';
import SchemaValidationError from '../errors/schemavalidationerror';

const debug = require('debug')('bind:rest:runtime:parseBody');

const TAG = 'PARSE-BODY';

/**
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
    .then(
      (rawBody): String => {
        const res = String(rawBody);
        debug('%s returning rawBody as String %s', TAG, res);
        return res;
      },
    )
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
 * @return Promise<Object>
 */
export function parseJsonBody(req: http.IncomingMessage, schema?: Object): Promise<Object> {
  debug('%s Entered parseJsonBody', TAG);
  return parseBody(req)
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

      return obj;
    });
}
