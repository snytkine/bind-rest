import 'reflect-metadata';
import { getTargetStereotype, Target, TargetStereoType, getMethodParamName } from 'bind-di';
import { PARAM_TYPES, SYM_METHOD_PARAMS } from '../metaprops';
import { PathDetailsParam } from '../../interfaces/pathdetailsparams';
import ControllerParamType from '../../enums/controllerparamtype';
import { IControllerParamMeta } from '../../interfaces/controllerparammeta';
import getParamType from './getparamtype';
import makeParamExtractorFactory from './makeparamextractorfactory';

const debug = require('debug')('promiseoft:decorators');

const TAG = 'METHOD-ARGUMENTS';

export type ParamDecoratorFunction = (
  target: Target,
  propertyKey: string,
  parameterIndex: number,
) => void;

function applyParamAnnotation(
  methodArgumentDetail: PathDetailsParam,
  target: Target,
  propertyKey: string,
): undefined {
  const index = methodArgumentDetail.position;

  const targetStereoType = getTargetStereotype(target);
  debug('%s targetStereoType="%s"', TAG, targetStereoType);

  if (targetStereoType !== TargetStereoType.PROTOTYPE) {
    throw new TypeError(`${ControllerParamType[methodArgumentDetail.type]} 
    can be added only to class method`);
  }

  debug(`Defining @PathParam ${String(methodArgumentDetail.name)} for arg ${index} 
  of method ${target.constructor.name}.${String(propertyKey)}`);

  /**
   *  Array of objects of PathDetailsParam
   *  This array gets new element each time this function is run on
   *  the same method which is the case where multiple arguments of the method
   *  are annotated with @PathParam
   */
  const metaDetails: Array<IControllerParamMeta> =
    Reflect.getMetadata(SYM_METHOD_PARAMS, target, propertyKey) || [];
  const paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);

  if (metaDetails[index]) {
    /**
     * This may be a the case when element has @Required decorator
     * in which case this method will be called twice.
     * But calling this method twice with different values of .name and .type is not allowed
     */
    if (metaDetails[index].f && methodArgumentDetail.type) {
      throw new Error(`Method parameter ${index} already defined 
      on method ${target.constructor.name}.${String(propertyKey)} 
      - ${JSON.stringify(metaDetails[index])}`);
    }

    /**
     * If the .required was added first then instead
     * add other values from passed methodArgumentDetails
     */
    metaDetails[index].f = makeParamExtractorFactory(
      methodArgumentDetail.type,
      methodArgumentDetail.name,
    );
    metaDetails[index].paramName = methodArgumentDetail.name;
    metaDetails[index].paramDecoratorType = methodArgumentDetail.type;
    metaDetails[index].paramType = getParamType(paramTypes, index);
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
     * @type {{type: ControllerParamType, name: string, position: number}}
     */
    metaDetails[index] = {
      f: makeParamExtractorFactory(methodArgumentDetail.type, methodArgumentDetail.name),
      paramDecoratorType: methodArgumentDetail.type,
      isRequired: false,
      paramName: methodArgumentDetail.name,
      paramType: getParamType(paramTypes, index),
    };
  }
  /**
   * Now set SYM_METHOD_PARAMS meta of this method with metaDetails value
   */
  Reflect.defineMetadata(SYM_METHOD_PARAMS, metaDetails, target, propertyKey);

  return undefined;
}

export const doParamAnnotation = (
  name: string,
  paramType: ControllerParamType,
): ParamDecoratorFunction => (
  target: Target,
  propertyKey: string,
  parameterIndex: number,
): undefined => {
  return applyParamAnnotation(
    {
      type: paramType,
      name,
      position: parameterIndex,
    },
    target,
    propertyKey,
  );
};

/**
 * @todo refactor this function
 * It's possible to take in 4 parameters
 * target, paramType, propertyKey, parameterIndex
 * and then either return function (target, propKey, paramIndex): void
 * or to call applyParamAnnotation
 *
 * @param target
 */
export const delegateParamAnnotation = (target: Target | string) => (
  paramType: ControllerParamType,
) => (propertyKey: string, parameterIndex: number): ParamDecoratorFunction | undefined => {
  if (typeof target === 'string') {
    return doParamAnnotation(target, paramType);
  }
  const paramName = getMethodParamName(target, propertyKey, parameterIndex);
  doParamAnnotation(paramName, paramType)(target, propertyKey, parameterIndex);
  return undefined;
};

export function PathParam(name: string);
export function PathParam(target: Target, propertyKey: string, parameterIndex: number);
export function PathParam(target: Target | string, propertyKey?: string, parameterIndex?: number) {
  return delegateParamAnnotation(target)(ControllerParamType.PathParam)(
    propertyKey,
    parameterIndex,
  );
}

export function QueryParam(name: string);
export function QueryParam(target: Target, propertyKey: string, parameterIndex: number);
export function QueryParam(target: Target | string, propertyKey?: string, parameterIndex?: number) {
  return delegateParamAnnotation(target)(ControllerParamType.QueryParam)(
    propertyKey,
    parameterIndex,
  );
}

export function HeaderParam(name: string);
export function HeaderParam(target: Target, propertyKey: string, parameterIndex: number);
export function HeaderParam(
  target: Target | string,
  propertyKey?: string,
  parameterIndex?: number,
) {
  return delegateParamAnnotation(target)(ControllerParamType.Header)(propertyKey, parameterIndex);
}

export function CookieParam(name: string);
export function CookieParam(target: Target, propertyKey: string, parameterIndex: number);
export function CookieParam(
  target: Target | string,
  propertyKey?: string,
  parameterIndex?: number,
) {
  return delegateParamAnnotation(target)(ControllerParamType.Cookie)(propertyKey, parameterIndex);
}

export function ContextParam(name: string);
export function ContextParam(target: Target, propertyKey: string, parameterIndex: number);
export function ContextParam(
  target: Target | string,
  propertyKey?: string,
  parameterIndex?: number,
) {
  return delegateParamAnnotation(target)(ControllerParamType.ContextParam)(
    propertyKey,
    parameterIndex,
  );
}
