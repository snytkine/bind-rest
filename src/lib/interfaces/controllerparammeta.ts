import { ParamExtractorFactory } from '../types/controllerparamextractor';
import { Maybe } from 'bind';

export interface IControllerParamMeta {
  f: ParamExtractorFactory
  isRequired: boolean
  paramName: string
  paramType?: any
  validator?: (input: any) => Maybe<Error>
}
