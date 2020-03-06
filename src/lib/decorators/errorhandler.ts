import { AppErrorHandler } from '../interfaces/apperrorhandler';
import { IS_ERROR_HANDLER } from './metaprops';
import { Component, COMPONENT_META_DATA, defineMetadata } from 'bind';
import { Newable } from '../interfaces';

const debug = require('debug')('promiseoft:decorators');

const TAG = '@ErrorHandler';

export function ErrorHandler(target: Newable<AppErrorHandler>) {

  debug('Defining %s for constructor %s', TAG, target.name);
  Component(target);
  let metaData = Reflect.getMetadata(COMPONENT_META_DATA, target) || {};
  metaData[IS_ERROR_HANDLER] = true;

  defineMetadata(COMPONENT_META_DATA, metaData, target);

}
