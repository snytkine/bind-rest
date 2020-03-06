import {SYM_COMPONENT_ENVIRONMENTS } from "./metaprops";
const debug = require('debug')('promiseoft:decorators');

const TAG = "@Environment";

export function Environment(...names: string[]) {

  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {

    if (typeof target === "function" && !propertyKey) {

      debug(`Defining '${TAG}' '${names.join(", ")}' for class ${target.name}`);
      let envs = Reflect.getMetadata(SYM_COMPONENT_ENVIRONMENTS , target);
      if (envs) {
        throw new SyntaxError(`Cannot add ${TAG} annotation to Class ${target.name} because it is already annotated as ${envs.join(", ")}`);
      }

      Reflect.defineMetadata(SYM_COMPONENT_ENVIRONMENTS , names, target);

    } else {
      throw new TypeError(`${TAG} '${names.join(", ")}' annotation was applied to .${propertyKey} bu can only be applied to a class.`);
    }

  }

}