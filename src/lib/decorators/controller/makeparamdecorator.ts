import { ClassPrototype } from 'bind-di';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import ControllerParamType from '../../enums/controllerparamtype';
import { IParamDecoratorFactory } from '../../types/decoratorfactory';
import applyNoParamDecorator from './applysingledecorator';
import { IParamDecorator } from '../../types/paramdecoratorfunc';

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
      ControllerParamType.CustomParamDecorator,
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
  return (factory: ParamExtractorFactory) => paramDecorator(factory);
}

export default makeParamDecorator;
