import { ParamExtractorFactory } from '../types/controllerparamextractor';
import { PathDetailsType } from '../enums';
import { AsyncParamValidator, ParamValidator } from '../types';

export interface IControllerParamMeta {
  f: ParamExtractorFactory
  isRequired: boolean
  paramName: string
  paramDecoratorType: PathDetailsType
  paramType?: any
  validator?: AsyncParamValidator
}
