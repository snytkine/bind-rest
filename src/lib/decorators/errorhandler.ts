import { AppErrorHandler } from '../interfaces/apperrorhandler';
import { IS_ERROR_HANDLER } from './metaprops';
import {
  Component,
  COMPONENT_META_DATA,
  DEFAULT_SCOPE,
  ComponentScope,
  defineMetadata
} from 'bind';
import { Constructor } from 'bind';

const debug = require('debug')('promiseoft:decorators');

const TAG = '@ErrorHandler';

export function ErrorHandler(target: Constructor<AppErrorHandler>) {

  debug('Defining %s for constructor %s', TAG, target.name);
  Component(target);
  let metaData = Reflect.getMetadata(COMPONENT_META_DATA, target) || {};
  metaData[IS_ERROR_HANDLER] = true;

  defineMetadata(COMPONENT_META_DATA, metaData, target)();
  /**
   * Default Scope is Prototype - separate instance per request
   * end-user can override it to be singleton if they want to.
   */
  defineMetadata(DEFAULT_SCOPE, ComponentScope.NEWINSTANCE, target)();
}
