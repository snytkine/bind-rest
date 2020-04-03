import { ParamExtractorFactory } from './controllerparamextractor';
import { IParamDecorator } from './paramdecoratorfunc';

export type IParamDecoratorFactory = (f: ParamExtractorFactory) => IParamDecorator
