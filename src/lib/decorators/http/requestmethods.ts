import { Target, Maybe, getOrElse } from 'bind';
import HTTPMethod from 'http-method-enum';
import { RETURN_TYPE, SYM_REQUEST_METHOD } from '../metaprops';
import { ControllerFunc } from '../../types';
import Path from '../controller/pathdecorator';

const debug = require('debug')('promiseoft:decorators');

const TAG = 'ADD_METHOD_ANNOTATION';

function addMethodAnnotation(
  target: any,
  propertyKey: string,
  method: HTTPMethod,
  descriptor?: TypedPropertyDescriptor<ControllerFunc>,
): undefined {
  let p: Maybe<Set<HTTPMethod>> = Reflect.getMetadata(SYM_REQUEST_METHOD, target, propertyKey);
  const rt = Reflect.getMetadata(RETURN_TYPE, target, propertyKey);
  debug(
    `Adding Method annotation %s to ${target.constructor.name}.${propertyKey} 
    returnType: ${rt}
    with descriptor=%s`,
    method,
    descriptor,
  );

  p = getOrElse(p, new Set<HTTPMethod>());
  p.add(method);

  debug('%s Annotated methods %o', TAG, p);

  Reflect.defineMetadata(SYM_REQUEST_METHOD, p, target, propertyKey);

  return undefined;
}

export type IMethodDecorator = (
  target: Target,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => void;

export const decorate = (
  pathOrTarget: string | Target,
  propertyKey: string,
  method: HTTPMethod,
  descriptor?: TypedPropertyDescriptor<ControllerFunc>,
): IMethodDecorator => {
  if (typeof pathOrTarget === 'string') {
    /**
     * Return function that takes target, property key, descriptor and then applies
     * metadata
     */
    return (target: Target, prop: string, desc: PropertyDescriptor) => {
      addMethodAnnotation(target, prop, method);
      /**
       * And now also apply @Path function
       */
      Path(pathOrTarget)(target, prop, desc);
    };
  }
  /**
   * target is actual class.
   * apply method annotation
   * but need to return function?
   */
  return addMethodAnnotation(pathOrTarget, propertyKey, method, descriptor);
};

export function GET(target: string): IMethodDecorator;
export function GET(
  target: Target,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<ControllerFunc>,
): void;
export function GET(
  target: string | Target,
  propertyKey?: string,
  descriptor?: TypedPropertyDescriptor<ControllerFunc>,
) {
  return decorate(target, propertyKey, HTTPMethod.GET, descriptor);
}

export function PUT(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<ControllerFunc>,
) {
  addMethodAnnotation(target, propertyKey, HTTPMethod.PUT, descriptor);
}

export function POST(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<ControllerFunc>,
) {
  addMethodAnnotation(target, propertyKey, HTTPMethod.POST, descriptor);
}

export function DELETE(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<ControllerFunc>,
) {
  addMethodAnnotation(target, propertyKey, HTTPMethod.DELETE, descriptor);
}
