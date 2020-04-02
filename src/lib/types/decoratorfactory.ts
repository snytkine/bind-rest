import { ParamExtractorFactory } from './controllerparamextractor';
import { paramdecorator } from './paramdecoratorfunc';

export type DecoratorFactory = (f: ParamExtractorFactory) => paramdecorator
