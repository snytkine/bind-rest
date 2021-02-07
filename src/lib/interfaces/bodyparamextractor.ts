import { ParamExtractorFactory } from '../types/controllerparamextractor';

export interface IBodyParamExtractor {
  query: string;
  paramExtractor: ParamExtractorFactory;
}
