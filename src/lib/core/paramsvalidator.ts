import { Maybe, isDefined } from 'bind-di';
import { IBindRestContext, IControllerParamMeta } from '../interfaces';
import {
  PARAM_TYPE_ARRAY,
  PARAM_TYPE_BOOLEAN,
  PARAM_TYPE_NUMBER,
  PARAM_TYPE_OBJECT,
  PARAM_TYPE_STRING,
} from '../consts/controllermethodparams';

import ControllerParamType from '../enums/controllerparamtype';
import ValidationError from '../errors/validation/inputvalidationerror';
import {
  AsyncContextParamValidator,
  AsyncParamValidator,
  IntoPromise,
} from '../types/paramvalidatorfunc';
import { DOTTED_LINE } from '../consts/dottedline';

const debug = require('debug')('bind:rest:runtime:validation');

const TAG = 'ParamsValidator';

export const printErrors = (errors: Array<Error>): string => {
  return errors.map((e) => e.message).join('\n');
};

export const isNullOrUndefined = (val: any): boolean => val === undefined || val === null;

/**
 * Validates that input is a number
 * @param i any
 * @returns number|undefined
 */
export const toNumber = (i: any): Number | TypeError => {
  /**
   * If undefined then return it as undefined
   * Do not convert to number. This way
   * it will be possible to use default value in controller
   */
  if (isNullOrUndefined(i)) return undefined;

  const x = Number(i);
  if (Number.isNaN(x)) {
    return new TypeError();
  }

  return x;
};

export const toArray = (i: any): Array<any> | TypeError => {
  /**
   * If undefined then return it as undefined
   * Do not convert to number. This way
   * it will be possible to use default value in controller
   */
  if (isNullOrUndefined(i)) return undefined;

  if (!Array.isArray(i)) {
    return new TypeError();
  }

  return i;
};

/**
 * If input param is not a string then something is wrong
 * For string returns false if string is empty or "false" case insensitive
 * any other string converts to boolean true.
 *
 * @param s
 * @returns boolean|undefined
 */
export const toBoolean = (s: any): boolean | TypeError => {
  /**
   * If undefined then return it as undefined
   * Do not convert to boolean. This way
   * it will be possible to use default value in controller
   */
  if (isNullOrUndefined(s)) return undefined;

  if (typeof s === 'boolean') {
    return s;
  }
  if (typeof s !== 'string') {
    return new TypeError();
  }

  const lc = s.toLocaleLowerCase();
  if (lc === 'false' || lc === '0') {
    return false;
  }
  if (lc === 'true' || lc === '1') {
    return true;
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
export const toString = (s: any): string | TypeError => {
  /**
   * If undefined then return it as undefined
   * Do not convert to string. This way
   * it will be possible to use default value in controller
   */
  if (isNullOrUndefined(s)) return undefined;
  if (typeof s === 'string') return s;
  if (s instanceof String) return s.valueOf();
  if (typeof s === 'number') return String(s);

  return new TypeError();
};

export const paramTypeToString = (paramType: any): string => {
  let ret = toString(paramType);
  if (paramType === null) {
    return 'Null';
  }
  if (paramType === undefined) {
    return 'undefined';
  }
  if (typeof ret === 'string') {
    return ret;
  }
  if (paramType.name) {
    return paramType.name;
  }
  try {
    ret = `${paramType}`;
    return ret;
  } catch (e) {
    return 'UNKNOWN_TYPE';
  }
};

interface ParamsWithMeta {
  params: Array<any>;
  meta: Array<IControllerParamMeta>;
}

export function validateRequired(o: ParamsWithMeta): ParamsWithMeta {
  const params = o.params.map((param, i) => {
    if (param instanceof Error) return param;

    if (o.meta[i] && o.meta[i].isRequired && isNullOrUndefined(param)) {
      return new Error(`
      Required parameter not passed from request
      parameterType="${ControllerParamType[o.meta[i].paramDecoratorType]}" 
      parameterName="${o.meta[i].paramName}" 
      position="${i + 1}"`);
    }

    return param;
  });

  return { params, meta: o.meta };
}

export function setParamType(o: ParamsWithMeta): ParamsWithMeta {
  const params = o.params.map((param, i) => {
    if (param instanceof Error) return param;

    let ret: any;
    if (!o.meta[i] || !o.meta[i].paramType) {
      debug('%s No meta or no paramType for param "%s"', TAG, o.meta[i]?.paramName);
      ret = param;
    } else {
      switch (o.meta[i].paramType) {
        case PARAM_TYPE_STRING:
          ret = toString(param);
          break;

        case PARAM_TYPE_NUMBER:
          ret = toNumber(param);
          break;

        case PARAM_TYPE_BOOLEAN:
          ret = toBoolean(param);
          break;

        case PARAM_TYPE_ARRAY:
          ret = toArray(param);
          break;

        case PARAM_TYPE_OBJECT:
          ret = param;
          break;

        default:
          /**
           * Here the paramType is some type of custom class
           * check that type of param is actually instance of that class
           * this will be the case with CustomDecorator
           * and also the case with @Router decorator where the type
           * is framework's Router component
           *
           * For a RequestBody set param prototype to custom paramType
           */
          if (o.meta[i].paramDecoratorType === ControllerParamType.Body) {
            /**
             * Check that param is NOT a string
             * if request did not have content-type header with application/json
             * then body would be just parsed into a string and not
             * converted to JSON
             * in such case throw exception
             */
            if (typeof param === 'string') {
              debug(
                '%s Cannot set prototype of body param to %s because body is string',
                TAG,
                paramTypeToString(o.meta[i].paramType),
              );
              ret = new TypeError();
            } else {
              debug('%s Setting prototype of Body param to "%s"', TAG, o.meta[i].paramType?.name);
              Reflect.setPrototypeOf(param, o.meta[i].paramType);
              ret = param;
            }
          } else if (param instanceof o.meta[i].paramType) {
            ret = param;
          } else {
            ret = new TypeError();
          }
      }
    }

    if (ret instanceof TypeError) {
      return new Error(`
      Request parameter of type "${typeof param}" 
      cannot be converted to "${paramTypeToString(o.meta[i].paramType)}"
      parameterType="${ControllerParamType[o.meta[i].paramDecoratorType]}" 
      parameterName="${o.meta[i].paramName}" 
      position="${i + 1}" 
      `);
    }

    return ret;
  });

  return { params, meta: o.meta };
}

function makeParamsValidator(meta: Array<IControllerParamMeta>, controllerName: string) {
  return function paramsValidator(params: Array<any>): Array<any> {
    debug(
      '%s entered paramsValidator for controller=%s with meta=%o params=%o',
      TAG,
      controllerName,
      meta,
      params,
    );
    const res = [validateRequired, setParamType].reduce(
      (acc, next) => {
        return next(acc);
      },
      { params, meta },
    );

    const errors = res.params.filter((param) => param instanceof Error);
    if (errors && errors.length > 0) {
      const message = printErrors(errors);
      /**
       *
       */
      debug('%s have ValidationErrors %s', TAG, message);

      throw new ValidationError(`Controller="${controllerName}"\nErrors:\n${message}`);
    }

    debug('%s paramsValidator returning params %o', TAG, res.params);

    return res.params;
  };
}

function makeValidateAsync(
  context: IBindRestContext,
  validators: Array<AsyncContextParamValidator>,
  controllerName: string,
): IntoPromise<Array<any>> {
  const asyncValidators: Array<AsyncParamValidator> = validators.map((v) => v(context));

  return function validateParamsAsync(params: any[]): Promise<any[]> {
    debug('%s Entered validateParamsAsync with params=%o', TAG, params);
    const validationResults: Array<Maybe<Error> | Promise<Maybe<Error>>> = params.map(
      (param: any, i: number) => {
        /**
         * If there is a validator for this index, apply validator,
         * else return undefined
         */
        if (asyncValidators[i]) {
          return asyncValidators[i](param);
        }
        return undefined;
      },
    );

    return Promise.all(validationResults).then((results: Array<Maybe<Error>>) => {
      /**
       * If any of the results are error
       * then format a single error message
       * and throw ValidationError from here
       *
       * Else return params from here (original array of params)
       * this way the return of validateParamsAsync will be Promise<original params>
       */
      debug('%s All validationResults are resolved %o', TAG, results);
      const errors: string[] = results.reduce((acc, next: Maybe<Error>) => {
        if (isDefined(next)) {
          acc.push(next.message);
        }

        return acc;
      }, []);

      if (errors.length > 0) {
        debug('%s have asyncValidation errors %o', TAG, errors);
        throw new ValidationError(`Controller=${controllerName}\n${errors.join(DOTTED_LINE)}`);
      } else {
        debug('%s no async validation errors. params=%o', TAG, params);
        return params;
      }
    });
  };
}

export { makeParamsValidator, makeValidateAsync };
