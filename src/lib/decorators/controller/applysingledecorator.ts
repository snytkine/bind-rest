import { Target, getMethodParamName } from 'bind';
import { PathDetailsType } from '../../enums/pathdetails';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import { PARAM_TYPES, SYM_METHOD_PARAMS } from '../metaprops';
import { IControllerParamMeta } from '../../interfaces/controllerparammeta';
import { getParamType } from './noargmethodparams';

export default function applyNoParamDecorator(
  target: Target,
  propertyKey: string,
  parameterIndex: number,
  required: boolean = false,
  methodParamType?: PathDetailsType,
  paramFactory?: ParamExtractorFactory,
) {
  const paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);
  /**
   *  Array of objects of PathDetailsParam
   *  This array gets new element each time this function is run on
   *  the same method which is the case where multiple arguments of the method
   *  are annotated with @PathParam
   */
  const metaDetails: Array<IControllerParamMeta> =
    Reflect.getMetadata(SYM_METHOD_PARAMS, target, propertyKey) || [];

  if (metaDetails[parameterIndex]) {
    /**
     * This may be a the case when element so has @Required decorator
     * in which case this method will be called twice.
     * But calling this method twice with different values of .name and .type is not allowed
     */
    if (metaDetails[parameterIndex].f && paramFactory) {
      throw new Error(`Method parameter ${parameterIndex} already defined 
      on method ${target.constructor?.name}.${propertyKey}`);
    }

    /**
     * If this was adding @Required to existing details then just add required.true to it
     */
    if (required) {
      metaDetails[parameterIndex].isRequired = required;
    } else {
      /**
       * If this the .required was added first then instead
       * add other values from passed methodArgumentDetails
       */
      metaDetails[parameterIndex].f = paramFactory;
      metaDetails[parameterIndex].paramDecoratorType = methodParamType;
      metaDetails[parameterIndex].paramType = getParamType(paramTypes, parameterIndex);
      metaDetails[parameterIndex].paramName = getMethodParamName(
        target,
        propertyKey,
        parameterIndex,
      );
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
      f: paramFactory,
      isRequired: required,
      paramDecoratorType: methodParamType,
      paramType: getParamType(paramTypes, parameterIndex),
      paramName: getMethodParamName(target, propertyKey, parameterIndex),
    };
  }
  /**
   * Now set SYM_METHOD_PARAMS meta of this method with metaDetails value
   */
  Reflect.defineMetadata(SYM_METHOD_PARAMS, metaDetails, target, propertyKey);
}
