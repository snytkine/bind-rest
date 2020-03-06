import {SYM_JSON_SCHEMA} from "./metaprops";
const debug = require('debug')('promiseoft:decorators');


const TAG = '@JsonSchema';

export function JsonSchema(schema: any) {
  /**
   * Make sure that schema is an object and has some properties
   */
  if(schema === null || typeof schema !== 'object'){
    throw new TypeError(`${TAG} schema must be an Object (a valid json schema). Check your classes annotated with ${TAG} and make sure the parameter is an object`);
  }
  //debugger;
  return function (target: any, propertyKey?: string) {
    if (typeof target === "function" && !propertyKey) {


      debug(`Defining ${TAG} for class ${target.name}`);
      let type = Reflect.getMetadata(SYM_JSON_SCHEMA, target);
      if (type) {
        throw new SyntaxError(`Cannot add ${TAG} decorator to Class '${target.name}' because it is already decorated with '${TAG}'`)
      }

      Reflect.defineMetadata(SYM_JSON_SCHEMA, schema, target);

    } else {
      throw new TypeError(`${TAG} decorator can be applied only to a class.`);
    }

  }

}