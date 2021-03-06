import 'reflect-metadata';
import {
  Component,
  COMPONENT_META_DATA,
  defineMetadata,
  DEFAULT_SCOPE,
  ComponentScope,
  Constructor,
} from 'bind-di';
import { MIDDLEWARE_PRIORITY } from './metaprops';
import { IMiddleware } from '../interfaces/middleware';

const debug = require('debug')('bind:rest:decorators');

const TAG = 'Middleware';

export type NumberOrMiddleware = number | Constructor<IMiddleware>;

const validatePriority = (i: any): boolean => {
  const res = Number(i);

  return !Number.isNaN(res) && res >= 0 && res <= 1000;
};

/**
 * Decorate the target as Component,
 * Add MIDDLEWARE as
 * @param target
 * @param priority
 */
export function decorateMiddleware(
  target: Constructor<IMiddleware>,
  priority: number,
  decoratorName: string = 'Middleware',
) {
  debug('Defining %s for constructor %s. decoratorName=%s', TAG, target.name, decoratorName);
  Component(target);
  /**
   * Need to set DEFAULT_SCOPE for Middleware component
   * NEWINSTANCE is more efficient than REQUEST scope because
   * it does not have to look for value in scope and does not
   * have to set the instance to scoped store
   * I cannot think of any use case where same middleware can be
   * used more than once in the REQUEST lifecycle
   */
  defineMetadata(DEFAULT_SCOPE, ComponentScope.NEWINSTANCE, target)();

  const metaData = Reflect.getMetadata(COMPONENT_META_DATA, target) || {};

  metaData[MIDDLEWARE_PRIORITY] = priority;

  defineMetadata(COMPONENT_META_DATA, metaData, target)();
}

export function Middleware(constructor: Constructor<IMiddleware>);
export function Middleware(priority: number);

export function Middleware(val: NumberOrMiddleware) {
  if (typeof val === 'number') {
    if (!validatePriority(val)) {
      throw new TypeError(`Value passed to @Middleware decorator '${val}' is invalid.  
      It must be a number between 0 and 1000`);
    }

    return function middlewareDecorator(constructor: Constructor<IMiddleware>) {
      decorateMiddleware(constructor, Number.MIN_SAFE_INTEGER + val, 'Middleware');
    };
  }
  decorateMiddleware(val, -1);
}

export function Afterware(priority: number) {
  if (!validatePriority(priority)) {
    throw new TypeError(`Value passed to @Middleware decorator '${priority}' is invalid.  
      It must be a number between 0 and 1000`);
  }

  return function middlewareDecorator(constructor: Constructor<IMiddleware>) {
    decorateMiddleware(constructor, priority, 'Afterware');
  };
}

/**
 * @todo this should probably be removed
 * because it cannot work in Lambda based setup because we cannot do anything
 * after response was returned to Lambda.
 *
 * This was used mostly to log response time or to fire off some async event after
 * response was already sent. This login can be moved to responseWriter.
 * @param priority
 * @constructor
 */
export function AfterResponse(priority: number) {
  return function middlewareDecorator(constructor: Constructor<IMiddleware>) {
    decorateMiddleware(constructor, priority + 1000, 'AfterResponse');
  };
}
