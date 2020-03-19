import 'reflect-metadata';
import { MIDDLEWARE_PRIORITY, SYM_MIDDLEWARE_PRIORITY } from './metaprops';
import { IMiddleware, MiddlewareFunc } from '../interfaces/middleware';
import { Newable } from '../interfaces';
import { Component, COMPONENT_META_DATA, defineMetadata } from 'bind';
import { Constructor } from '../types';

const debug = require('debug')('promiseoft:decorators');

const TAG = 'Middleware';

/**
 * Decorate the target as Component,
 * Add MIDDLEWARE as
 * @param target
 * @param priority
 */
function decorateMiddleware(target: Constructor<IMiddleware>, priority: number) {
  debug('Defining %s for constructor %s', TAG, target.name);
  Component(target);
  let metaData = Reflect.getMetadata(COMPONENT_META_DATA, target) || {};
  metaData[MIDDLEWARE_PRIORITY] = priority;

  defineMetadata(COMPONENT_META_DATA, metaData, target)();
}

function addMiddlewareFuncAnnotation(target: any, propertyKey: string, descriptor: PropertyDescriptor, priority: number): void {

  /**
   * When defined on property vs on method:
   * descriptor is undefined
   * target is object with .constructor.name=Name of Middleware Class
   *
   * propertyKey is name of property (example : myMW)
   * Signature of this method is not available here but it will be created when middleware is instantiated because
   * Typescript compiles it so that function is created inside the constructor
   * This means that since this passed the compiler - the signature of function assigned to property
   * is a valid middleware
   *
   * The means we can safely use this property as a method but only in created object, it's not part of prototype.
   * Since this type of property cannot use 'this' in its signature, it will be 100% safe to use this created object
   * as singleton - create once and call the method with different context objects is safe.
   *
   * This also means that this method cannot rely on anything added to object via @Inject
   *
   * But the object can have other middleware methods, so it may not be totally safe to mark this as Singleton unless
   * we can be sure that object has no other methods marked as Middleware Function.
   *
   * So how can we add this property to be used as middleware function? Can we just add it here the same way as normal method?
   * No because target and even target.prototype does not have this propertyKey yet. We can create new method on the target's
   * prototype, making it delegate call to the property and decorate it with SYM_MIDDLEWARE_PRIORIT
   *
   * When added to a method - the target is object with .constructor and with .delay (as in name of this property) and it also
   * has descriptor object with .value of type function. target does NOT have .prototype in this case!
   *
   */
  let p = Reflect.getMetadata(SYM_MIDDLEWARE_PRIORITY, target, propertyKey);
  debug(`Adding MiddlewareFunc annotation to ${target.constructor.name}.${propertyKey}`);

  if (p) {
    throw new TypeError(`Middleware annotations is already defined on ${target.constructor.name}.${propertyKey}. Only one annotations @Before, @BeforeController or @BeforeResponse can be defined per middleware method`);
  }

  Reflect.defineMetadata(SYM_MIDDLEWARE_PRIORITY, priority, target, propertyKey);

}


export function Middleware_(target: Newable<any>, propertyKey?: string, descriptor?: PropertyDescriptor) {

  debug(`Defining @Middleware for constructor ${target.name}`);
  let proto = target.prototype;
  /**
   * proto is a object with declared middleware method
   * We can loop over the prototype properties, ignoring constructor
   * and make sure that there is at least one function with SYM_MIDDLEWARE_PRIORITY annotation.
   */
  let props = Object.getOwnPropertyNames(proto);

  let hasMiddlewareFunc = props.some(p => {
    return !!(Reflect.getMetadata(SYM_MIDDLEWARE_PRIORITY, proto, p));
  });

  if (!hasMiddlewareFunc) {
    throw new TypeError(`Classs ${target.name} is annotated with @Middleware but does not have any functions annotated with either @Before, @AfterController or @AfterResponse`);
  }

  //Reflect.defineMetadata(SYM_COMPONENT_TYPE, ComponentType.MIDDLEWARE, target);

}

export function Before(priority: number) {
  if (!validatePriority(priority)) {
    throw new TypeError(`Value passed to @Before annotations '${priority}' is invalid.  It must be a number between 1 and 100. `);
  }

  return function (target: any, propertyKey?: string, descriptor?: TypedPropertyDescriptor<MiddlewareFunc>) {
    addMiddlewareFuncAnnotation(target, propertyKey, descriptor, Number.MIN_SAFE_INTEGER + ~~priority);
  };
}


export function AfterController(priority: number) {
  if (!validatePriority(priority)) {
    throw new TypeError(`Value passed to @AfterController annotations '${priority}' is invalid.  It must be a number between 1 and 100. `);
  }
  return function (target: any, propertyKey?: string, descriptor?: TypedPropertyDescriptor<MiddlewareFunc>) {
    addMiddlewareFuncAnnotation(target, propertyKey, descriptor, ~~priority);
  };
}


export function AfterResponse(priority: number) {
  if (!validatePriority(priority)) {
    throw new TypeError(`Value passed to @AfterResponse annotations '${priority}' is invalid.  It must be a number between 1 and 100. `);
  }
  return function (target: any, propertyKey?: string, descriptor?: TypedPropertyDescriptor<MiddlewareFunc>) {
    addMiddlewareFuncAnnotation(target, propertyKey, descriptor, ~~priority + 100);
  };
}

const validatePriority = (i: any): boolean => {

  let res = Number(i);

  return !isNaN(res) && res > 0 && res < 1000;
};


export function Middleware(priority: number) {

  if (!validatePriority(priority)) {
    throw new TypeError(`Value passed to @Middleware decorator '${priority}' is invalid.  
    It must be a number between 1 and 1000`);
  }

  return function middlewareDecorator(constructor: Constructor<IMiddleware>) {
    decorateMiddleware(constructor, (Number.MIN_SAFE_INTEGER + ~~priority));
  };

}
