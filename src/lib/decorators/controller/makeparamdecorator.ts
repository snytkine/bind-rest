import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import { ClassPrototype } from 'bind';
import { PathDetailsType } from '../../enums';
import { applySingleAnnotation } from './noargmethodparams';
import { IParamDecoratorFactory, IParamDecorator } from '../../types';

const paramDecorator = (decoratorFactory: ParamExtractorFactory): IParamDecorator => {

  return function customParamDecorator(target: ClassPrototype,
                                       propertyKey: string,
                                       parameterIndex: number) {

    return applySingleAnnotation(
      target,
      propertyKey,
      parameterIndex,
      false,
      PathDetailsType.CustomParamDecorator,
      decoratorFactory,
    );
  };
};

function makeParamDecorator(): IParamDecoratorFactory
function makeParamDecorator(f: ParamExtractorFactory): IParamDecorator
function makeParamDecorator(f?: ParamExtractorFactory): IParamDecorator | IParamDecoratorFactory {

  if (f) {
    return paramDecorator(f);
  } else {
    return (f: ParamExtractorFactory) => paramDecorator(f);
  }

}

export default makeParamDecorator;
