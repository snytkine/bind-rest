import "reflect-metadata";
import * as raw from 'raw-body';
import * as inflate from 'inflation';
import {parse as formatBytes} from 'bytes';
import {IContext, IBodyParserOptions, ParsedBodyType} from "../interfaces";
import {Validator} from 'jsonschema'
import {TypeValidationError} from "../core/apperrors";
const debug = require('debug')('promiseoft:runtime:middleware:jsonbody');
const TAG = "RequestBodyParserMiddleware";
const stufFunc = _ => _;

const SchemaValidatorFactory = (schema: any) => {
  if (!schema) {
    debug('SchemaValidatorFactory Schema not provided. Returning stub function');
    return stufFunc
  }

  return body => {
    let v = new Validator();
    let res = v.validate(body, schema, {propertyName: "RequestBody"});
    if (!res.valid) {
      throw new TypeValidationError(res.toString());
    } else {
      return body;
    }
  }

};


const SetPrototypeFactory = (proto) => {
  if (!proto) {
    debug('%s SetPrototypeFactory prototype not provided. Returning stub function', TAG);
    return stufFunc
  }

  return body => {
    if (!Reflect.setPrototypeOf(body, proto)) {
      console.error(`${TAG} Unable to set prototype for parsed body`);
    }

    return body;
  }
};

export class RequestBodyParserMiddleware {

  /**
   * @param options: IBodyParserOptions
   */
  constructor(private readonly options: IBodyParserOptions = {parsedBodyType: ParsedBodyType.TO_JSON}) {
  }


  /**
   * If options parsedBodyType === ParsedBodyType.TO_TEXT
   * then just parse request body to string and set ctx.parsedBody as a string
   * This will be used by the controller as a string.
   * This will work because the option parsedBodyType === ParsedBodyType.TO_TEXT
   * came from parsing a controller functions because controller has @RequestBody body: string (it expects request body as a string)
   *
   * @param ctx
   * @returns {Promise<IContext>}
   */
  parseBody(ctx: IContext): Promise<IContext> {

    debug('%s Entered .parseBody with request method %s', TAG, ctx.method, " options: ", this.options);
    const validateSchema = SchemaValidatorFactory(this.options.schema);
    const setPrototype = SetPrototypeFactory(this.options.proto);
    /**
     * @todo this guard may be unnecessary
     * basically we are guarding against the case that someone
     * will put @RequestBody annotation on a controller method that is not for POST or PUT
     * It's better that we check for this when parsing the controller annotations GET or DELETE
     * to make sure there are no body parsing in there.
     *
     * @type {[string,string]}
     */
    let allowedMethods: Array<string> = ['PUT', 'POST'];
    if (!allowedMethods.includes(ctx.method)) {
      debug('%s skipping body parsing for request method %s for url: %s', TAG, ctx.method, ctx.originalUrl);

      return Promise.resolve(ctx);
    }

    /**
     * @todo check request's content-type and it must be application/json otherwise
     * log and throw error
     * In the future there will be another router middleware just to check content-type
     * and it will be added if there is a @Consumes("application/json") annotation on the
     * controller method
     */

    /**
     * @todo get encoding also from request header if it is present and can be extracted
     */
    let len = ctx.req.headers['content-length'];
    let encoding = ctx.req.headers['content-encoding'] || 'identity';
    if (len && encoding === 'identity') {
      this.options.length = ~~len;
    }

    this.options.encoding = this.options.encoding || 'utf8';
    this.options.limit = this.options.limit || formatBytes('4mb');

    debug('%s calling raw() with options: %o', TAG, this.options);

    let parsed = raw(inflate(ctx.req), this.options)
        .then((rawBody): String => String(rawBody))
        .then(body => body.valueOf());

    if (this.options.parsedBodyType === ParsedBodyType.TO_TEXT) {
      debug("Request body parsed to TEXT ONLY");
    } else {
      debug("Parsing text body to JSON");
      parsed = parsed.then(body => JSON.parse(body))
          .then(validateSchema)
          .then(setPrototype);
    }

    return parsed.then(body => {
      ctx.parsedBody = body;

      return ctx;
    });

  }

}
