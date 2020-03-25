import { ParamExtractorFactory } from '../types/controllerparamextractor';
import { Maybe } from 'bind';
import { PathDetailsType } from '../enums';

export interface IControllerParamMeta {
  f: ParamExtractorFactory
  isRequired: boolean
  paramName: string
  paramDecoratorType: PathDetailsType
  paramType?: any
  validator?: (input: any) => Maybe<Error>
}
