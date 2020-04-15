import 'reflect-metadata';
import {
  ClassPrototype,
  COMPONENT_IDENTITY,
  ComponentIdentity,
  Constructor,
  EXTRA_DEPENDENCIES,
  getTargetStereotype,
  IfIocComponent,
  IfIocContainer,
  TargetStereoType,
  ClassOrMethodDecorator,
} from 'bind-di';
import { IMiddleware } from '../interfaces';
import { SYM_CONTROLLER_MIDDLEWARES } from './metaprops';
import { ControllerFunc, IMiddlewareFactory, MiddlewareFunc } from '../types';
import Context from '../../components/context';

const debug = require('debug')('promiseoft:decorators');

const TAG = '@Middlewares';

export const toMWFactory = (middleware: Constructor<IMiddleware>): IMiddlewareFactory => {
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

export const toMWFuncFactory = (arr: Array<IMiddlewareFactory>): IMiddlewareFactory => {
  return (container: IfIocContainer) => {
    const aMW: Array<MiddlewareFunc> = arr.map((f) => f(container));

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

export function Middlewares(
  ...middlewares: Array<Constructor<IMiddleware>>
): ClassOrMethodDecorator<ControllerFunc> {
  return function middlewaresDecorator(
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
          throw new Error(`@Middlewares decorator can be applied only to Class 
          or controller method.
          It was upplied to unsupported property of class "${target?.constructor?.name}"`);
        }
        break;

      default:
        throw new Error(`@Middlewares decorator can be applied only to Class 
        or controller method.`);
    }

    let aMiddlewares: IMiddlewareFactory[] =
      Reflect.getMetadata(SYM_CONTROLLER_MIDDLEWARES, target, propertyKey) || [];

    /**
     * Add array of middleware factories to
     * existing array of factories (if one already exists)
     * These new middleware factories are added to the end of array.
     * This way multiple decorators that create middleware factory
     * can be added to controller
     * The order will depend on which decorator is added higher and which is lower.
     */
    aMiddlewares = aMiddlewares.concat(middlewares.map(toMWFactory));

    /**
     * Add middlewareFactory as SYM_CONTROLLER_MIDDLEWARES to target, propertyKey
     */
    debug(`Adding ${TAG} decorator with ${aMiddlewares.length} middlewares 
    to '${target.constructor.name}.${propertyKey}' controller.`);

    Reflect.defineMetadata(SYM_CONTROLLER_MIDDLEWARES, aMiddlewares, target, propertyKey);

    /**
     * Need to get array if Identities from array of IMiddleware constructors
     */
    const extraDependencies: Array<ComponentIdentity> = middlewares.map((dep) => {
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
     *
     * @todo here  the extraDependencies are defined on target with propertyKey
     * But I'm not sure that when getting extra dependencies for a component
     * we look at all property keys, I think we just look at component level.
     */
    Reflect.defineMetadata(EXTRA_DEPENDENCIES, extraDependencies, target, propertyKey);
  };
}
