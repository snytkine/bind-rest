import 'reflect-metadata';
import { getTargetStereotype, Constructor, ClassPrototype, TargetStereoType } from 'bind';
import { SYM_REQUEST_PATH } from '../metaprops';
import { ControllerFunc } from '../../types';
import ApplicationError from '../../errors/applicationerror';

const debug = require('debug')('promiseoft:decorators');

const TAG = '@Path';

const decorateControllerClass = (target: Constructor<any>, path: string): void => {
  const ctrlPath = Reflect.getMetadata(SYM_REQUEST_PATH, target);

  if (ctrlPath) {
    debug(
      '%s "%s" already defined on controller "%s" Attempted to set another value="%s"',
      TAG,
      ctrlPath,
      target.name,
      path,
    );
  }

  /**
   * basePath IF not empty then MUST start with a slash
   */
  if (path && path[0] !== '/') {
    throw new ApplicationError(
      `Annotation @Path '${path}' of controller class is invalid. It must start with a '/' Did you mean /${path}'?`,
    );
  }

  Reflect.defineMetadata(SYM_REQUEST_PATH, path, target);

  return undefined;
};

const decorateControllerMethod = (
  target: ClassPrototype,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<ControllerFunc>,
  path: string,
): void => {
  let normalizedPath = path;
  if (!propertyKey) {
    throw new ApplicationError(`method name is not provided to Path decorator 
    for class=${target.constructor.name}`);
  }

  if (!descriptor || !descriptor.value || typeof descriptor.value !== 'function') {
    throw new ApplicationError(`Cannot apply @Path to "${target.constructor.name}.${propertyKey}"
    because property "${propertyKey}" is not a function`);
  }

  debug(
    'Defining %s path="%s" for controller="%s.%s"',
    TAG,
    path,
    target.constructor.name,
    propertyKey,
  );

  if (path[0] !== '/') {
    normalizedPath = `/${path}`;
  }

  Reflect.defineMetadata(SYM_REQUEST_PATH, normalizedPath, target, propertyKey);

  return undefined;
};

export default function Path(path: string) {
  debug('Path decorator called with %s', path);
  /**
   * @todo
   * Can validate path string and throw if not valid like if contains invalid chars, spaces, etc.
   */

  return function pathDecorator(
    target: Constructor<any> | ClassPrototype,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<ControllerFunc>,
  ) {
    debug('%s entered pathDecorator', TAG);

    const targetType = getTargetStereotype(target);
    let res;
    switch (targetType) {
      case TargetStereoType.CONSTRUCTOR:
        res = decorateControllerClass(target as Constructor<any>, path);
        break;

      case TargetStereoType.PROTOTYPE:
        res = decorateControllerMethod(target, propertyKey, descriptor, path);
        break;

      default:
        throw new ApplicationError(`@Path decorator cannot be applied to this type of target`);
    }

    return res;
  };
}
