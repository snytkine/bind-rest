import {
  Component,
  COMPONENT_META_DATA,
  DEFAULT_SCOPE,
  ComponentScope,
  defineMetadata,
  Constructor,
} from 'bind';
import { AppErrorHandler } from '../interfaces/apperrorhandler';
import { IS_ERROR_HANDLER } from './metaprops';

const debug = require('debug')('promiseoft:decorators');

const TAG = '@ErrorHandler';

export default function ErrorHandler(target: Constructor<AppErrorHandler>) {
  debug('Defining %s for constructor %s', TAG, target.name);
  Component(target);
  const metaData = Reflect.getMetadata(COMPONENT_META_DATA, target) || {};
  metaData[IS_ERROR_HANDLER] = true;

  defineMetadata(COMPONENT_META_DATA, metaData, target)();
  /**
   * Default Scope is Prototype - separate instance per request
   * end-user can override it to be singleton if they want to.
   */
  defineMetadata(DEFAULT_SCOPE, ComponentScope.NEWINSTANCE, target)();
}
