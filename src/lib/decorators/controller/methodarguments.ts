import "reflect-metadata";
import {SYM_METHOD_PARAMS} from '../metaprops'
import {PathDetailsParam} from '../../interfaces/pathdetailsparams'
import {PathDetailsType} from '../../enums/pathdetails'
const debug = require('debug')('promiseoft:decorators');
const TAG = 'METHOD-ARGUMENTS';

function applyParamAnnotation(methodArgumentDetail: PathDetailsParam, target: Object, propertyKey: string | symbol) {

  const index = methodArgumentDetail.position;
  /**
   *  Array of objects of PathDetailsParam
   *  This array gets new element each time this function is run on
   *  the same method which is the case where multiple arguments of the method
   *  are annotated with @PathParam
   */
  let metaDetails: Array<PathDetailsParam>;

  if (!target.constructor || !target.constructor.name) {
    throw new TypeError(`${PathDetailsType[methodArgumentDetail['type']]} can be added only to class method`);
  }

  debug(`Defining @PathParam ${methodArgumentDetail['name']} for arg ${index} of method ${target.constructor.name}.${String(propertyKey)}`);


  metaDetails = Reflect.getMetadata(SYM_METHOD_PARAMS, target, propertyKey);


  if (!metaDetails) {
    metaDetails = [];
  }

  if (metaDetails[index]) {

    /**
     * This may be a the case when element so has @Required decorator
     * in which case this method will be called twice.
     * But calling this method twice with different values of .name and .type is not allowed
     */
    if (metaDetails[index].type && methodArgumentDetail.type) {
      throw new Error(`Method parameter ${index} already defined on method ${target.constructor.name}.${String(propertyKey)} - ${JSON.stringify(metaDetails[index])}`);
    }

    /**
     * If this the .required was added first then instead
     * add other values from passed methodArgumentDetails
     */
    metaDetails[index].name = methodArgumentDetail.name;
    metaDetails[index].type = methodArgumentDetail.type;
    metaDetails[index].position = methodArgumentDetail.position;

  } else {


    /**
     * @todo check that position of last element is == parameterIndex-1
     *        If it's not, then it would mean that there is one or more un-annotated params,
     *        in which case there will be a gap in the array, ie: elements with keys 0,1 but now adding paramIndex 3
     *        Currently JavaScript is fine with this and will just fill the gap with null
     *        Maybe we can be extra careful and just insert null for missing elements. Just to be sure.
     *
     *        Later if we want to add support for non-decorated parameters based on types
     *        We will be able to fill in the missing elements in the controller parser when we extract
     *        design:type for parameters
     *
     *        But probably support for undecorated parameters is not a good idea.
     *        If we know for sure that undecorated parameters are not supported
     *        then we can detect this gap in array here and throw an Error.
     *        At least it will be thrown at initialization time.
     *
     * @type {{type: PathDetailsType, name: string, position: number}}
     */
    metaDetails[index] = methodArgumentDetail;
  }
  /**
   * Now set SYM_METHOD_PARAMS meta of this method with metaDetails value
   */
  Reflect.defineMetadata(SYM_METHOD_PARAMS, metaDetails, target, propertyKey);
}


function applySingleAnnotation(annotationType: PathDetailsType = null, target: Object, propertyKey: string | symbol, parameterIndex: number, required = false) {

  /**
   *  Array of objects of PathDetailsParam
   *  This array gets new element each time this function is run on
   *  the same method which is the case where multiple arguments of the method
   *  are annotated with @PathParam
   */
  let metaDetails: Array<PathDetailsParam>;

  if (!target.constructor || !target.constructor.name) {
    throw new TypeError(`${PathDetailsType[annotationType]} can be added only to class method`);
  }

  debug(`Defining ${PathDetailsType[annotationType]} for arg ${parameterIndex} of method ${target.constructor.name}.${String(propertyKey)}`);

  metaDetails = Reflect.getMetadata(SYM_METHOD_PARAMS, target, propertyKey);

  if (!metaDetails) {
    metaDetails = [];
  }


  if (metaDetails[parameterIndex]) {

    /**
     * This may be a the case when element so has @Required decorator
     * in which case this method will be called twice.
     * But calling this method twice with different values of .name and .type is not allowed
     */
    if (metaDetails[parameterIndex].type && annotationType) {
      throw new Error(`Method parameter ${parameterIndex} already defined on method ${target.constructor.name}.${String(propertyKey)} - ${JSON.stringify(metaDetails[parameterIndex])}`);
    }

    /**
     * If this was adding @Required to existing details then just add required.true to it
     */
    if (required) {
      metaDetails[parameterIndex].required = required;
    } else {

      /**
       * If this the .required was added first then instead
       * add other values from passed methodArgumentDetails
       */
      metaDetails[parameterIndex].type = annotationType;
      metaDetails[parameterIndex].position = parameterIndex;
    }
  } else {


    /**
     * @todo check that position of last element is == parameterIndex-1
     *        If it's not, then it would mean that there is one or more un-annotated params,
     *        in which case there will be a gap in the array, ie: elements with keys 0,1 but now adding paramIndex 3
     *        Currently JavaScript is fine with this and will just fill the gap with null
     *        Maybe we can be extra careful and just insert null for missing elements. Just to be sure.
     *
     *        Later if we want to add support for non-decorated parameters based on types
     *        We will be able to fill in the missing elements in the controller parser when we extract
     *        design:type for parameters
     *
     *        But probably support for undecorated parameters is not a good idea.
     *        If we know for sure that undecorated parameters are not supported
     *        then we can detect this gap in array here and throw an Error.
     *        At least it will be thrown at initialization time.
     *
     * @type {{type: PathDetailsType, name: string, position: number}}
     */
    metaDetails[parameterIndex] = {
      type: annotationType,
      name: "",
      value: "",
      position: parameterIndex,
      required: required
    };
  }
  /**
   * Now set SYM_METHOD_PARAMS meta of this method with metaDetails value
   */
  Reflect.defineMetadata(SYM_METHOD_PARAMS, metaDetails, target, propertyKey);
}

export function RequestBody(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.RequestBody, target, propertyKey, parameterIndex);
}

export function Request(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.Request, target, propertyKey, parameterIndex);
}


export function Response(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.Response, target, propertyKey, parameterIndex);
}


export function OriginalUrl(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.OriginalUrl, target, propertyKey, parameterIndex);
}


export function RequestMethod(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.RequestMethod, target, propertyKey, parameterIndex);
}


export function Headers(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.Headers, target, propertyKey, parameterIndex);
}


export function Coookies(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.Cookies, target, propertyKey, parameterIndex);
}


export function UriInfo(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.UriInfo, target, propertyKey, parameterIndex);
}


export function Context(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.Context, target, propertyKey, parameterIndex);
}


export function ContextScope(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.ContextScope, target, propertyKey, parameterIndex);
}


export function QueryString(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.QueryString, target, propertyKey, parameterIndex);
}


export function Query(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(PathDetailsType.Query, target, propertyKey, parameterIndex);
}

export function Required(target: Object, propertyKey: string | symbol, parameterIndex: number) {

  return applySingleAnnotation(null, target, propertyKey, parameterIndex, true);
}

/**
 * @Required decorator is somewhat special
 */

export function PathParam(name: string) {

  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    return applyParamAnnotation({
      type: PathDetailsType.PathParam,
      name: name,
      position: parameterIndex
    }, target, propertyKey);
  }

}

export function QueryParam(name: string) {

  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {

    return applyParamAnnotation({
      type: PathDetailsType.QueryParam,
      name: name,
      position: parameterIndex
    }, target, propertyKey);
  }

}


export function HeaderParam(name: string) {

  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {

    return applyParamAnnotation({
      type: PathDetailsType.HeaderParam,
      name: name,
      position: parameterIndex
    }, target, propertyKey);
  }

}


export function CookieParam(name: string) {

  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {

    return applyParamAnnotation({
      type: PathDetailsType.CookieParam,
      name: name,
      position: parameterIndex
    }, target, propertyKey);
  }

}


export function ContextScopeParam(name: string) {

  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {

    return applyParamAnnotation({
      type: PathDetailsType.ContextScopeParam,
      name: name,
      position: parameterIndex
    }, target, propertyKey);
  }

}
