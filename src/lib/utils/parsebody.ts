import * as http from 'http';
import inflate from 'inflation';
import raw from 'raw-body';
import { Validator } from 'jsonschema';
import { SchemaValidationError } from '../core';

/**
 * Convert incoming request into a string
 * @param req node's request http.IncomingMessage
 * @return Promise<string>
 */
export function parseBody(req: http.IncomingMessage): Promise<string> {

  let allowedMethods = ['PUT', 'POST'];
  if (!allowedMethods.includes(req.method)) {
    throw new Error(`
  Error: Cannot extract Body from Request.
  Reason: request method "${req.method}" cannot include request body`);
  }

  const ret: Promise<string> = raw(inflate(req))
    .then((rawBody): String => String(rawBody))
    .then(body => body.valueOf()).catch(e => {
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

  return parseBody(req).then(JSON.parse).then(obj => {

    let validator: Validator;
    if (schema) {
      validator = new Validator();
      let res = validator.validate(obj, schema, { propertyName: 'Object' });
      if (!res.valid) {
        throw new SchemaValidationError(`Schema Validation Error="${res.toString()}"`);
      }
    }

    return obj
  });
}
