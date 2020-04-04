import { ParamExtractorFactory } from '../types';

export interface IBodyParamExtractor {
  query: string;
  paramExtractor: ParamExtractorFactory;
}
