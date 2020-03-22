import "reflect-metadata";
import {TypeValidationError} from "../core/apperrors";
import {PathDetailsType} from "../enums/pathdetails";
import {PARAM_TYPES, SYM_METHOD_PARAMS} from "../decorators/metaprops";
import {MiddlewareFunc} from "../types";
import {IContext} from "../interfaces/context";
import {ClassMethod} from "../types/controllers";
//import {isUndefined} from "util";
import {PathDetailsParam} from "../interfaces/pathdetailsparams";
import { Context } from '../core/context';

const debug = require('debug')('promiseoft:runtime:middleware');
const TAG = 'paramsValidatorFactory';

/**
 * Validates that input is a number
 * @param i any
 * @returns number|undefined
 */
const toNumber = (i: any): Number|TypeError => {

  /**
   * If undefined then return it as undefined
   * Do not convert to number. This way
   * it will be possible to use default value in controller
   */
  if (i === undefined) return i;

  let x = Number(i);
  if (isNaN(x)) {
    return new TypeError();
  }

  return x;
};

/**
 * If input param is not a string then something is wrong
 * For string returns false if string is empty or "false" case insensitive
 * any other string converts to boolean true.
 *
 * @param s
 * @returns boolean|undefined
 */
const toBoolean = (s: any): boolean|TypeError => {

  /**
   * If undefined then return it as undefined
   * Do not convert to boolean. This way
   * it will be possible to use default value in controller
   */
  if (s === undefined) return s;

  if (typeof s === "boolean") return s;

  if (typeof s !== "string") return new TypeError();

  s = s.toLocaleLowerCase();
  if (s === "false" || s === "0" || s === "no") {
    return false;
  } else if (s === "true" || s === "1" || s === "yes") {
    return true
  }

  return new TypeError();
};


/**
 * If null of undefined return empty string
 * If variable is a string primitive return it
 * If variable is String object convert to string primitive
 * If variable is Number return string representation
 *
 * For all other types it's not safe to convert to string
 *
 * @param s
 * @returns {any}
 */
const toString = (s: any): string|TypeError => {

  /**
   * If undefined then return it as undefined
   * Do not convert to string. This way
   * it will be possible to use default value in controller
   */
  if (s === undefined) return s;
  if (s === null) return "";
  if (typeof s === 'string') return s;
  if (s instanceof String) return s.valueOf();
  if (typeof s === 'number') return String(s);

  return new TypeError();
};


export function paramsValidatorFactory(method: ClassMethod): MiddlewareFunc {

  const [o, p] = method;
  debug('%s Entered paramValidatorFactory for method %s', TAG, p);
  const paramTypes = Reflect.getMetadata(PARAM_TYPES, o, p);
  const paramsMeta: Array<PathDetailsParam> = Reflect.getMetadata(SYM_METHOD_PARAMS, o, p);

  debug('%s paramTypes: %o paramsMeta: %o', TAG, paramTypes, paramsMeta);

  /**
   * @todo this can be optimized the type check
   * switch (paramTypes[i].name) {.... this can be done beforehand, not at run time
   * we already know all the paramTypes from annotations and can generate function
   * that has pre-created array of functions param => param
   * takes array of values (controllerArguments array) and .map it using function from pre-created validators array
   * using array index to find corresponding validator function.
   *
   * Also if there are no paramTypes or no paramsMeta just return stub function
   * that returns same input, if (!paramTypes || !paramsMeta) { ... can be avoided at runtime
   */
  return function paramsValidator(ctx: Context): Promise<Context> {

    if (!paramsMeta) {
      debug('%s no paramsMeta nothing to validate in %s', TAG, (o.constructor.name + '.' + p));
      return Promise.resolve(ctx);
    }

    let args = ctx.controllerArguments;

    //debugger;
    ctx.controllerArguments = args.map((arg, i) => {

      let res;
      /**
       * Validate ONLY params that exist in paramsMeta - only annotated params.
       * @todo in the future IF we implement parsing unannotated params
       * in case of methods POST, PUT where consumes is set to application/json
       * then we may allow an unannotated param that will represent body. But that may
       * be not a good idea.
       */
      if (!paramsMeta[i] || !paramsMeta[i].type) {
        debug('Param %d of method %s is not annotated. Skipping type validation', i, (o.constructor.name + '.' + p));
        return arg;
      }

      switch (paramTypes[i].name) {
        case 'Number':
          res = toNumber(arg);
          break;

        case 'Boolean':
          res = toBoolean(arg);
          break;

        case 'String':
        case 'string':
          res = toString(arg);
          break;
        default:
          if (typeof paramTypes[i].validate === 'function' && paramTypes[i].validate.length === 1) {
            res = paramTypes[i].validate(arg);
          } else {
            res = arg;
          }


          /**
           * @todo if there is a json schema in options then validate parsed json against schema
           * This would automatically take place
           */


          /**
           * If there is a proto in the options then then object's prototype to proto
           * Do NOT do anything if paramTypes[i] is just an "Object" - that is the case where param does not have
           * a defined type.
           *
           * @todo Right now setting custom object as prototype of param is done ONLY for RequestBody - only for
           * objects that come in the body of the request and parsed into object.
           *
           * Maybe Later we can also set custom Class as prototype for other types
           * of params, especially when submitted forms parser is ready.
           */
          if (paramsMeta[i].type === PathDetailsType.RequestBody) {
            if (typeof paramTypes[i] === 'function' && paramTypes[i].prototype && paramTypes[i].name !== 'Object' && paramTypes[i].prototype.constructor) {
              let protoName = paramTypes[i].prototype.constructor.name;
              debug("Setting prototype of parsed Json body to %s", TAG, protoName);
              if (!Reflect.setPrototypeOf(res, paramTypes[i].prototype)) {
                console.error(`${TAG} Failed to set prototype of parsedBody`);
              }
            }
          }

      }

      if (res === undefined) {

        debug(`Argument  ${PathDetailsType[paramsMeta[i].type]} (arg ${i + 1})  '${arg}' passed to ${o.constructor.name}.${p} cannot be converted to ${paramTypes[i].name}.`)
        if (paramsMeta[i].required === true) {
          throw new TypeValidationError(`Required parameters ${PathDetailsType[paramsMeta[i].type]} '${paramsMeta[i].name}' not passed in request (arg ${i + 1}) in ${o.constructor.name}.${p}`);
        }
      }

      if (res instanceof TypeError) {
        throw new TypeValidationError(`Argument  ${PathDetailsType[paramsMeta[i].type]} (arg ${i + 1})  '${arg}' passed to ${o.constructor.name}.${p} cannot be converted to ${paramTypes[i].name}.`)
      }

      return res;

    });

    return Promise.resolve(ctx);
  }

}
