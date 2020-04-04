import { ClassPrototype } from 'bind';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import { PathDetailsType } from '../../enums';
import { IParamDecoratorFactory, IParamDecorator } from '../../types';
import applyNoParamDecorator from './applysingledecorator';

const paramDecorator = (decoratorFactory: ParamExtractorFactory): IParamDecorator => {
  return function customParamDecorator(
    target: ClassPrototype,
    propertyKey: string,
    parameterIndex: number,
  ) {
    return applyNoParamDecorator(
      target,
      propertyKey,
      parameterIndex,
      false,
      PathDetailsType.CustomParamDecorator,
      decoratorFactory,
    );
  };
};

function makeParamDecorator(): IParamDecoratorFactory;
function makeParamDecorator(f: ParamExtractorFactory): IParamDecorator;
function makeParamDecorator(f?: ParamExtractorFactory): IParamDecorator | IParamDecoratorFactory {
  if (f) {
    return paramDecorator(f);
  }
  return (f: ParamExtractorFactory) => paramDecorator(f);
}

export default makeParamDecorator;
