import { ClassPrototype, Constructor, getTargetStereotype, TargetStereoType } from 'bind';
import {
  IMethodDecorator,
  ControllerFunc,
  IMiddlewareFactory,
  IMethodDecoratorFactory,
  ClassOrMethodDecorator,
} from '../../types';

import { SYM_CONTROLLER_MIDDLEWARES } from '../metaprops';

const decorateMethod = (
  decoratorFactory: IMiddlewareFactory,
): ClassOrMethodDecorator<ControllerFunc> => {
  return function controllerMethodDecorator(
    target: ClassPrototype | Constructor<any>,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<ControllerFunc>,
  ) {
    const targetStereotype = getTargetStereotype(target);

    switch (targetStereotype) {
      case TargetStereoType.CONSTRUCTOR:
        break;

      case TargetStereoType.PROTOTYPE:
        if (
          !propertyKey ||
          !descriptor ||
          !descriptor.value ||
          typeof descriptor.value !== 'function'
        ) {
          throw new Error(`Custom controller decorator can be applied only to Class 
          or controller method.
          It was upplied to unsupported property of class "${target?.constructor?.name}"`);
        }
        break;

      default:
        throw new Error(`Custom controller decorator can be applied only to Class 
        or controller method.`);
    }

    /**
     * define controller middleware metadata.
     */
    const aMiddlewares: IMiddlewareFactory[] =
      Reflect.getMetadata(SYM_CONTROLLER_MIDDLEWARES, target, propertyKey) || [];

    /**
     * Add array of middleware factories to
     * existing array of factories (if one already exists)
     * These new middleware factories are added to the end of array.
     * This way multiple decorators that create middleware factory
     * can be added to controller
     * The order will depend on which decorator is added higher and which is lower.
     */
    aMiddlewares.push(decoratorFactory);

    Reflect.defineMetadata(SYM_CONTROLLER_MIDDLEWARES, aMiddlewares, target, propertyKey);
  };
};

function makeDecorator(): IMethodDecoratorFactory;
function makeDecorator(f: IMiddlewareFactory): ClassOrMethodDecorator<ControllerFunc>;
function makeDecorator(
  f?: IMiddlewareFactory,
): ClassOrMethodDecorator<ControllerFunc> | IMethodDecoratorFactory {
  let ret: IMethodDecorator<ControllerFunc> | IMethodDecoratorFactory;
  if (f) {
    ret = decorateMethod(f);
  } else {
    ret = (factory: IMiddlewareFactory) => decorateMethod(factory);
  }

  return ret;
}

export default makeDecorator;
