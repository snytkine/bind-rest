import {
  Target,
  Component,
  COMPONENT_META_DATA,
  defineMetadata,
  DEFAULT_SCOPE,
  ComponentScope,
  Constructor,
} from 'bind';
import { IS_CONTROLLER } from '../metaprops';

const debug = require('debug')('promiseoft:decorators');

const TAG = '@Controller';

/**
 * Process @Controller decorator for the class
 * @Controller is a component so first apply @Component decorator
 * and then add metadata indicating that this component is a controller.
 * Also add DefaultScope because Controllers should be Prototype scoped by default
 * Individual controller scope can be overwritten using @Scope or @Singleton decorator
 *
 *
 * @todo by this time this class should already have some controller methods defined
 * we should validate that it has at least one controller method or else throw error
 *
 * @todo any benefit of allowing @Controller to be named? It may be useful for debugging
 * Maybe in the future...
 *
 *
 * @param target
 * @constructor
 * @returns undefined
 */
export default function Controller(target: Constructor<any>): void {
  debug('Defining %s for constructor %s', TAG, target.name);
  Component(target);
  const metaData = Reflect.getMetadata(COMPONENT_META_DATA, target) || {};
  metaData[IS_CONTROLLER] = true;

  defineMetadata(COMPONENT_META_DATA, metaData, target)();
  defineMetadata(DEFAULT_SCOPE, ComponentScope.NEWINSTANCE, target)();
}
