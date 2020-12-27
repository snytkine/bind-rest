import { ParamExtractorFactory } from '../types/controllerparamextractor';
import ControllerParamType from '../enums/controllerparamtype';
import { AsyncValidator } from '../types/paramvalidatorfunc';

/**
 * @todo make validator an Array of AsyncValidators
 * This will require updates to AsyncValidator decorator and to
 * a method that is used in parsecontroller that creates validator
 *
 * Having an array of validators will accomplish 2 things:
 * first there will be possible to have more than one
 * @Validate and @ValidateAsync decorator per parameter
 *
 * second in case of @Body decorator if there is a custom class for body
 * and has JsonSchema with it then a separate validator function can be added
 * to .validator array as first validator. And it will be possible to have
 * other custom validators for body in addition to Schema Validator
 */
export interface IControllerParamMeta {
  f: ParamExtractorFactory;
  isRequired: boolean;
  paramName: string;
  paramDecoratorType: ControllerParamType;
  paramType?: any;
  validator?: AsyncValidator;
}
