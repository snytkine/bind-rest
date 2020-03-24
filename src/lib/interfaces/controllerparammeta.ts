import { ParamExtractorFactory } from '../types/controllerparamextractor';
import { Maybe } from 'bind';
import { PathDetailsType } from '../enums';

export interface IControllerParamMeta {
  f: ParamExtractorFactory
  isRequired: boolean
  paramName: string
  argumentType: PathDetailsType
  paramType?: any
  validator?: (input: any) => Maybe<Error>
}
