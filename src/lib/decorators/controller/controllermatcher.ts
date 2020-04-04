import { ClassPrototype, COMPONENT_META_DATA, defineMetadata } from 'bind';
import { IControllerMatcher, ControllerFunc } from '../../types';
import { CONTROLLER_MATCHER } from '../metaprops';
import { ApplicationError } from '../../core';

export default function RequestMatch(matcher: IControllerMatcher) {
  return (
    target: ClassPrototype,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<ControllerFunc>,
  ): undefined => {
    const metaData = Reflect.getMetadata(COMPONENT_META_DATA, target) || {};
    if (metaData[CONTROLLER_MATCHER]) {
      throw new ApplicationError(`CONTROLLER_MATCHER is already defined 
      for controller "${target.constructor.name}.${propertyKey}"`);
    }

    metaData[CONTROLLER_MATCHER] = matcher;

    defineMetadata(COMPONENT_META_DATA, metaData, target, propertyKey)();

    return undefined;
  };
}
