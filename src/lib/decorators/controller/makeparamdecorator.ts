import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import { ClassPrototype } from 'bind';
import { PathDetailsType } from '../../enums';
import { applySingleAnnotation } from './noargmethodparams';
import { DecoratorFactory, paramdecorator } from '../../types';

const paramDecorator = (decoratorFactory: ParamExtractorFactory): paramdecorator => {

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

function makeParamDecorator(): DecoratorFactory
function makeParamDecorator(f: ParamExtractorFactory): paramdecorator
function makeParamDecorator(f?: ParamExtractorFactory): paramdecorator | DecoratorFactory {

  if (f) {
    return paramDecorator(f);
  } else {
    return (f: ParamExtractorFactory) => paramDecorator(f);
  }

}

export default makeParamDecorator;
