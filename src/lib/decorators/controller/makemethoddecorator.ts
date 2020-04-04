import { ClassPrototype } from 'bind';
import {
  IMethodDecorator,
  ControllerFunc,
  IMiddlewareFactory,
  IMethodDecoratorFactory,
} from '../../types';

import { SYM_CONTROLLER_MIDDLEWARES } from '../metaprops';

const debug = require('debug')('promiseoft:decorators');

const TAG = 'MAKE-CONTROLLER-DECORATOR';

const decorateMethod = (decoratorFactory: IMiddlewareFactory): IMethodDecorator => {
  return function controllerMethodDecorator(
    target: ClassPrototype,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<ControllerFunc>,
  ) {
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

    /**
     * Add middlewareFactory as SYM_CONTROLLER_MIDDLEWARES to target, propertyKey
     */
    debug(`Adding ${TAG} decorator with ${aMiddlewares.length} middlewares 
    to '${target.constructor.name}.${propertyKey}' controller.
    methodType=${typeof descriptor.value}`);

    Reflect.defineMetadata(SYM_CONTROLLER_MIDDLEWARES, aMiddlewares, target, propertyKey);
  };
};

function makeDecorator(): IMethodDecoratorFactory;
function makeDecorator(f: IMiddlewareFactory): IMethodDecorator;
function makeDecorator(f?: IMiddlewareFactory): IMethodDecorator | IMethodDecoratorFactory {
  let ret: IMethodDecorator | IMethodDecoratorFactory;
  if (f) {
    ret = decorateMethod(f);
  } else {
    ret = (f: IMiddlewareFactory) => decorateMethod(f);
  }

  return ret;
}

export default makeDecorator;
