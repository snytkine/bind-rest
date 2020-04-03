import 'reflect-metadata';
import { ControllerFunc, IMiddleware } from '../interfaces';
import { SYM_CONTROLLER_MIDDLEWARES } from './metaprops';
import { MiddlewareFunc, MiddlewareFuncFactory } from '../types';
import {
  Constructor,
  ClassPrototype,
  COMPONENT_IDENTITY,
  EXTRA_DEPENDENCIES,
  IfIocContainer,
  IfIocComponent,
  ComponentIdentity,
} from 'bind';
import Context from '../../components/context';

const debug = require('debug')('promiseoft:decorators');
const TAG = '@Middlewares';

export const toMWFactory = (middleware: Constructor<IMiddleware>): MiddlewareFuncFactory => {

  return (container: IfIocContainer) => {
    const mwID = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, middleware);
    debug('%s got mwID="%s"', TAG, mwID);

    const componentDetails: IfIocComponent = container.getComponentDetails(mwID);

    return (context: Context) => {
      const oMW = <IMiddleware>componentDetails.get([context]);

      return oMW.doFilter(context);
    };
  };
};

export const toMWFuncFactory = (arr: Array<MiddlewareFuncFactory>): MiddlewareFuncFactory => {

  return (container: IfIocContainer) => {

    const aMW: Array<MiddlewareFunc> = arr.map(f => f(container));

    return (context: Context): Promise<Context> => {

      return aMW.reduce((acc, next) => {

        return acc.then(next);

      }, Promise.resolve(context));
    };
  };
};

/**
 * @todo in the future allow to apply
 * to controller class
 *
 * applied to individual controller methods.
 * @param middlewares
 * @constructor
 */
export function Middlewares(...middlewares: Array<Constructor<IMiddleware>>) {

  return function middlewaresDecorator(target: ClassPrototype,
                                       propertyKey: string,
                                       descriptor: TypedPropertyDescriptor<ControllerFunc>) {

    debug('%s defining on controller method="%s.%s" descriptorTime="%s"',
      TAG,
      target.constructor?.name, propertyKey,
      typeof descriptor.value,
    );

    let aMiddlewares: MiddlewareFuncFactory[] = Reflect.getMetadata(
      SYM_CONTROLLER_MIDDLEWARES,
      target, propertyKey,
    ) || [];

    /**
     * Add array of middleware factories to
     * existing array of factories (if one already exists)
     * These new middleware factories are added to the end of array.
     * This way multiple decorators that create middleware factory
     * can be added to controller
     * The order will depend on which decorator is added higher and which is lower.
     */
    aMiddlewares = aMiddlewares.concat(middlewares.map(toMWFactory));
    //const middlewareFactory: MiddlewareFuncFactory = toMWFuncFactory(middlewareFactories);

    /**
     * Add middlewareFactory as SYM_CONTROLLER_MIDDLEWARES to target, propertyKey
     */
    debug(`Adding ${TAG} decorator on '${target.constructor.name}.${propertyKey}' controller. 
    Middlewares: ${JSON.stringify(middlewares)}`);

    Reflect.defineMetadata(SYM_CONTROLLER_MIDDLEWARES, aMiddlewares, target, propertyKey);

    /**
     * Need to get array if Identities from array of IMiddleware constructors
     */
    const extraDependencies: Array<ComponentIdentity> = middlewares.map(dep => {
      const ret = Reflect.getMetadata(COMPONENT_IDENTITY, dep);
      if (!ret) {
        throw new Error(`${TAG} decorator. Could not determine identity of middleware ${dep.name}`);
      }

      return ret;
    });

    /**
     * Controller method needs these middlewares
     * so these middlewares must be set as dependencies of component.
     * When component is added to container these dependencies should be available
     * for extraction as dependencies.
     */
    Reflect.defineMetadata(EXTRA_DEPENDENCIES, extraDependencies, target, propertyKey);

  };
}
