import { IControllerParamMeta } from '../interfaces';
import {
  PARAM_TYPE_ARRAY,
  PARAM_TYPE_BOOLEAN,
  PARAM_TYPE_NUMBER,
  PARAM_TYPE_OBJECT,
  PARAM_TYPE_STRING,
} from '../consts';
import { HttpError } from '../errors';
import HTTP_STATUS_CODES from 'http-status-enum';
import { PathDetailsType } from '../enums';

const debug = require('debug')('promiseoft:runtime:validation');
const TAG = 'ParamsValidator';

export const printErrors = (errors: Array<Error>): string => {
  return errors.map(e => e.message).join('\n');
};

type IParamsValidator = (params: ParamsWithMeta) => ParamsWithMeta;

export const isNullOrUndefined = (val: any): boolean => val===undefined || val===null;

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

  let x = Number(i);
  if (isNaN(x)) {
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

  if(!Array.isArray(i)){
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

  if (typeof s==='boolean') {
    return s;
  } else if (typeof s!=='string') {
    return new TypeError();
  }

  s = s.toLocaleLowerCase();
  if (s==='false' || s==='0') {
    return false;
  } else if (s==='true' || s==='1') {
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
  if (typeof s==='string') return s;
  if (s instanceof String) return s.valueOf();
  if (typeof s==='number') return String(s);

  return new TypeError();
};


export const paramTypeToString = (paramType: any):string => {
  let ret = toString(paramType);
  if(paramType === null){
    return 'Null';
  } else if(paramType === undefined){
    return 'undefined';
  } else if(typeof ret === 'string'){
    return ret;
  } else if (paramType.name){
    return paramType.name;
  } else {
    try {
      ret = ''+ paramType;
      return ret;
    } catch(e){
      return 'UNKNOWN_TYPE';
    }
  }
};

interface ParamsWithMeta {
  params: Array<any>
  meta: Array<IControllerParamMeta>
}


export function validateRequired(o: ParamsWithMeta): ParamsWithMeta {

  const params = o.params.map((param, i) => {

    if (param instanceof Error) return param;

    if (o.meta[i] && o.meta[i].isRequired && isNullOrUndefined(param)) {
      return new Error(`
      Required parameter not passed from request
      parameterType="${PathDetailsType[o.meta[i].paramDecoratorType]}" 
      parameterName="${o.meta[i].paramName}" 
      position="${i + 1}"`);
    }

    return param;
  });

  return { params, meta: o.meta };
}


export function customValidate(o: ParamsWithMeta): ParamsWithMeta {

  const params = o.params.map((param, i) => {
    if (param instanceof Error) return param;

    if (o.meta[i] && o.meta[i].validator) {
      const res = o.meta[i].validator(param);
      if(!res){
        return param;
      }

      return new Error(`Validation failed for parameter 
      parameterType="${PathDetailsType[o.meta[i].paramDecoratorType]}" 
      parameterName="${o.meta[i].paramName}" 
      position="${i + 1}"
      ValidationError=${res.message}`);
    }

    return param;
  });

  return { params, meta: o.meta };
}


export function setParamType(o: ParamsWithMeta): ParamsWithMeta {

  const params = o.params.map((param, i) => {

    if (param instanceof Error) return param;

    let ret: any;
    if (!o.meta[i]) {
      ret = param;
    } else if(o.meta[i].paramDecoratorType === PathDetailsType.RequestBody){
      /**
       * Skip this step because setting of param type for body
       * takes place in body param extractor.
       */
      debug('%s Skipping setParamType for @Body param');
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
        /**ne
         * Also for Custom extractor type the type check
         * check that type of param is actually instance of paramType
         */
        if(o.meta[i].paramDecoratorType === PathDetailsType.CustomParamDecorator &&
          param instanceof o.meta[i].paramType){
          ret = param;
        } else {
          ret = new TypeError();
        }

      }
    }

    if (ret instanceof TypeError) {
      return new Error(`
      Request parameter cannot be converted to ${paramTypeToString(o.meta[i].paramType)}
      parameterType="${PathDetailsType[o.meta[i].paramDecoratorType]}" 
      parameterName="${o.meta[i].paramName}" 
      position="${i + 1}" 
      `);
    }

    return ret;
  });

  return { params, meta: o.meta };
}


export function makeParamsValidator(meta: Array<IControllerParamMeta>, controllerName: string) {

  return function paramsValidator(params: Array<any>): Array<any> {

    const res = [
      validateRequired,
      customValidate,
      setParamType,
    ].reduce((acc, next) => {
      return next(acc);
    }, { params, meta });

    const errors = res.params.filter(param => param instanceof Error);
    if (errors && errors.length > 0) {
      const message = printErrors(errors);

      throw new HttpError(HTTP_STATUS_CODES.BAD_REQUEST,
        `Input Validation Error. Controller="${controllerName}" \n${message}`);
    }

    return res.params;

  };
}

