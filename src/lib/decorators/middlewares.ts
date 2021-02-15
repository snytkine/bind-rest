import 'reflect-metadata';
import {
  ClassOrMethodDecorator,
  ClassPrototype,
  COMPONENT_IDENTITY,
  ComponentIdentity,
  Constructor,
  EXTRA_DEPENDENCIES,
  getTargetStereotype,
  IfIocComponent,
  IfIocContainer,
  TargetStereoType,
} from 'bind-di';
import { IBindRestContext, IMiddleware } from '../interfaces';
import { SYM_CONTROLLER_MIDDLEWARES } from './metaprops';
import { ControllerFunc, IMiddlewareFactory, MiddlewareFunc } from '../types';

const debug = require('debug')('bind:rest:decorators');

const TAG = '@Middlewares';

export const toMWFactory = (middleware: Constructor<IMiddleware>): IMiddlewareFactory => {
  return (container: IfIocContainer) => {
    const mwID = <ComponentIdentity>Reflect.getMetadata(COMPONENT_IDENTITY, middleware);
    debug('%s got mwID="%s"', TAG, mwID);

    const componentDetails: IfIocComponent = container.getComponentDetails(mwID);

    return (context: IBindRestContext) => {
      const oMW = <IMiddleware>componentDetails.get([context]);

      return oMW.doFilter(context);
    };
  };
};

export const toMWFuncFactory = (arr: Array<IMiddlewareFactory>): IMiddlewareFactory => {
  return (container: IfIocContainer) => {
    const aMW: Array<MiddlewareFunc> = arr.map((f) => f(container));

    return (context: IBindRestContext): Promise<IBindRestContext> => {
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

/**
 * @todo if applied to controller method need to add EXTRA_DEPENDENCIES to target
 * If applied to class constructor then need to add EXTRA_DEPENDENCIES to target.prototype
 *
 * @todo before adding EXTRA_DEPENDENCIES need to get existing EXTRA_DEPENDENCIES from target
 * because some other decorator may have already added some extra dependencies.
 * Then contact possible existing extra dependencies with these dependencies before setting
 * EXTRA_DEPENDENCIES.
 *
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
          It was applied to unsupported property of class "${target?.constructor?.name}"`);
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
     * @todo here  the extraDependencies are defined on target with propertyKey (optional)
     * if target is a constructor should probably also define on .prototype?
     *
     * @todo factor out setExtraDependencies function, it will accept deps, target, propKey
     * it will first get existing extra dependencies for target/propkey and then append
     * to existing array
     *
     * Best it to create method appendMetadata<T>(META_KEY, aValues: Array<T>, target, propKey)
     * it will first getMetadata or empty array, then concat and then save.
     */
    Reflect.defineMetadata(EXTRA_DEPENDENCIES, extraDependencies, target, propertyKey);

    if (targetStereotype === TargetStereoType.PROTOTYPE) {
      Reflect.defineMetadata(
        EXTRA_DEPENDENCIES,
        extraDependencies,
        target.constructor,
        propertyKey,
      );
    }
  };
}
