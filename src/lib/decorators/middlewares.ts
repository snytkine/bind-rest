import 'reflect-metadata';
import { ControllerFunc, IMiddleware } from '../interfaces';
import { SYM_CONTROLLER_MIDDLEWARES } from './metaprops';
import { Constructor, MiddlewareFunc, MiddlewareFuncFactory } from '../types';
import {
  Target,
  COMPONENT_IDENTITY,
  EXTRA_DEPENDENCIES,
  IfIocContainer,
  ComponentIdentity
} from 'bind';
import Context from '../../components/context';

const debug = require('debug')('promiseoft:decorators');
const TAG = '@Middlewares';

export const toMWFactory = (middleware: Constructor<IMiddleware>): MiddlewareFuncFactory => {

  return (container: IfIocContainer) => {
    const mwID = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, middleware);

    return (context: Context) => {
      const oMW = <IMiddleware>container.getComponent(mwID, [context]);

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

  return function middlewaresDecorator(target: Target, propertyKey: string, descriptor: TypedPropertyDescriptor<ControllerFunc>) {

    debug('%s defining on controller method="%s.%s"', TAG, target?.constructor?.name, propertyKey);
    let p = Reflect.getMetadata(SYM_CONTROLLER_MIDDLEWARES, target, propertyKey);
    if (p) {
      throw new ReferenceError(`${TAG} decorator already exists on controller 
        "${target.constructor.name}.${propertyKey}"`);
    }

    /**
     * Create single middlewareFactory function from
     * array of Middleware Classes
     */
    const middlewareFactories: Array<MiddlewareFuncFactory> = middlewares.map(toMWFactory);
    const middlewareFactory: MiddlewareFuncFactory = toMWFuncFactory(middlewareFactories);

    /**
     * Add middlewareFactory as SYM_CONTROLLER_MIDDLEWARES to target, propertyKey
     */
    debug(`Adding ${TAG} decorator on '${target.constructor.name}.${propertyKey}' controller. Middlewares: ${JSON.stringify(middlewares)}`);
    Reflect.defineMetadata(SYM_CONTROLLER_MIDDLEWARES, middlewareFactory, target, propertyKey);

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
