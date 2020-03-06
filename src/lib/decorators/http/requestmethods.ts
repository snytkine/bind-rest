import { PARAM_TYPES, RETURN_TYPE, SYM_REQUEST_METHOD } from '../metaprops';
import { RequestMethod } from '../../enums/requestmethods';
import { ControllerFunc } from '../../interfaces/controller';
import { Path } from '../controller/pathdecorator';
import { Target } from 'bind';

const debug = require('debug')('promiseoft:decorators');

function addMethodAnnotation(target: any, propertyKey: string, method: RequestMethod): undefined {

  let p = Reflect.getMetadata(SYM_REQUEST_METHOD, target, propertyKey);
  let rt = Reflect.getMetadata(RETURN_TYPE, target, propertyKey);
  debug(`Adding Method annotation ${RequestMethod[method]} to ${target.constructor.name}.${propertyKey} returnType: ${rt}`);

  let paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);
  debug(`paramTypes for ${target.constructor.name}.${propertyKey} is ${JSON.stringify(paramTypes)}`);

  p = p || [];
  p.push(method);

  debug(`Annotated methods ${JSON.stringify(p)}`);

  Reflect.defineMetadata(SYM_REQUEST_METHOD, p, target, propertyKey);

  return undefined;

}

export type IMethodDecorator = (target: Target, propertyKey: string, descriptor: PropertyDescriptor) => void
export type IPropKey2MethodDecorator = (propertyKey: string, method: RequestMethod) => IMethodDecorator | undefined;

export const decorate = (pathOrTarget: string | Target, propertyKey: string, method: RequestMethod): IMethodDecorator => {

  if (typeof pathOrTarget==='string') {
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
  } else {
    /**
     * target is actual class.
     * apply method annotation
     * but need to return function?
     */
    return addMethodAnnotation(pathOrTarget, propertyKey, method);
  }
};


export const decorate2 = (pathOrTarget: string | Target): IPropKey2MethodDecorator => {

  if (typeof pathOrTarget==='string') {
    /**
     * Return function that takes target, property key, descriptor and then applies
     * metadata
     */
    return (p, method) => (target: Target, prop: string, desc: PropertyDescriptor) => {
      addMethodAnnotation(target, prop, method);
      /**
       * And now also apply @Path function
       */
      Path(pathOrTarget)(target, prop, desc);
    };
  } else {
    /**
     * target is actual class.
     * apply method annotation
     * but need to return function?
     */
    return (p, method) => {
      addMethodAnnotation(pathOrTarget, p, method);
      return undefined;
    };
  }
};

export function GET(target: string): IMethodDecorator
export function GET(target: string | Target, propertyKey?: string, descriptor?: TypedPropertyDescriptor<ControllerFunc>) {

  return decorate(target, propertyKey, RequestMethod.GET);
}


export function PUT(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<ControllerFunc>) {
  addMethodAnnotation(target, propertyKey, RequestMethod.PUT);
}


export function POST(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<ControllerFunc>) {
  addMethodAnnotation(target, propertyKey, RequestMethod.POST);
}


export function DELETE(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  addMethodAnnotation(target, propertyKey, RequestMethod.DELETE);
}


export function ALL(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<ControllerFunc>) {
  addMethodAnnotation(target, propertyKey, RequestMethod.ALL);
}



