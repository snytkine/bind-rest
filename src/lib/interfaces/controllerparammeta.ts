import { ParamExtractorFactory } from '../types/controllerparamextractor';
import { PathDetailsType } from '../enums';
import { AsyncValidator, ParamValidator } from '../types';

export interface IControllerParamMeta {
  f: ParamExtractorFactory
  isRequired: boolean
  paramName: string
  paramDecoratorType: PathDetailsType
  paramType?: any
  validator?: AsyncValidator
}
