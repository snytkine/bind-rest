import "reflect-metadata";
import {ControllerFunc,} from "../interfaces";
import {SYM_CONTROLLER_MIDDLEWARES} from './metaprops'
import {ComponentType} from "../enums/componenttype";
const debug = require('debug')('promiseoft:decorators');
const TAG = "@Middlewares";

export interface Constructable {
  constructor: Function
  name?:string
}


// applied to class it could be just set to Newable<any>
// applied to method target is objectg with .constuctor: Function
//
// |Constructable needed for controller methods
export function Middlewares(...middlewares: string[]) {
//TypedPropertyDescriptor<ControllerFunc>
  return function middlewaresDecorator(target: Constructable, propertyKey?: string, descriptor?: TypedPropertyDescriptor<ControllerFunc>) {

    if (propertyKey && descriptor) {
      debug(`${TAG} defining on controller method ${target.constructor.name}.${propertyKey}`);
      let p = Reflect.getMetadata(SYM_CONTROLLER_MIDDLEWARES, target, propertyKey);
      if (p) {
        throw new ReferenceError(`${TAG} decorator already exists on controller ${target.constructor.name}.${propertyKey}: ${JSON.stringify(p)}`);
      }
      /**
       * @Important controller method needs these middlewares
       * so these middlewares must be set as dependencies of component.
       * When component is added to container these dependencies should be available
       * for extraction as dependencies.
       *
       */
      /*const mwDeps: Array<IComponentDependency> = middlewares.map(name => {
        return {componentName: name, propName: "", type: ComponentType.CONTROLLER_MIDDLEWARE}
      });*/

     // let deps: Array<IComponentDependency> = Reflect.getMetadata(SYM_COMPONENT_DEPENDENCIES, target);

     //if (!deps) {
      //  deps = mwDeps;
      //} else {
        /**
         * Add each of the 'middlewares' name to deps as
         * {componentName: name, propName: "", type: ComponentType.ControllerMiddleware}
         */
       //deps = deps.concat(mwDeps);
      //}

      //debug(`${TAG} adding controller middlewares to component dependencies. New deps: ${JSON.stringify(deps)}`);
      //Reflect.defineMetadata(SYM_COMPONENT_DEPENDENCIES, deps, target);

      /**
       * Add SYM_CONTROLLER_MIDDLEWARES array to target, propertyKey
       */
      debug(`Adding ${TAG} decorator on '${target.constructor.name}.${propertyKey}' controller. Middlewares: ${JSON.stringify(middlewares)}`)
      Reflect.defineMetadata(SYM_CONTROLLER_MIDDLEWARES, middlewares, target, propertyKey);
    } else {

      /**
       * @todo if defining on controller class should also add
       * to DEPENDENCIES metadata.
       */
      debug(`${TAG} defining on Controller class ${target.name}`);
      Reflect.defineMetadata(SYM_CONTROLLER_MIDDLEWARES, middlewares, target);
    }
  }
}
