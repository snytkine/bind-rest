import "reflect-metadata";
import {SYM_REQUEST_PATH} from '../metaprops'
const debug = require('debug')('promiseoft:decorators');


export function Path(path: string) {
  debug('Path decorator called with %s', path);
  /**
   * @todo
   * Can validate path string and throw if not valid like if contains invalid chars, spaces, etc.
   */

  if (path) {
    //path = path.replace(/\{/g, ':').replace(/}/g, '');
  }

  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (!target.constructor || !target.constructor.name) {
      throw new TypeError(`@Path can be added only to class or class method. Invalid use of @Path annotation in ${module.filename}`);
    }

    /**
     * @todo use getStereotype from bind
     * to figure out this is constructor or prototype
     */
    if (typeof target === "function" && !propertyKey) {
      debug(`Defining @Path ${path} for controller class ${target.name}`);
      let ctrlPath = Reflect.getMetadata(SYM_REQUEST_PATH, target);
      if (ctrlPath) {
        debug(`@Path ${ctrlPath} already defined on controller ${target.name} Attempted to set another @Path ${path}`);
      }

      /**
       * basePath IF not empty then MUST start with a slash
       */
      if(path && path[0] !== "/"){
        throw new Error(`Annotation @Path '${path}' of controller class ${target.name} is invalid. It must start with a '/' Did you mean /${path}'?`)
      }
      /**
       * @todo may need to add metadata to target.constructor or target.prototype
       * of both depending on how we plan to extract this data later.
       */
      Reflect.defineMetadata(SYM_REQUEST_PATH, path, target);


    } else {
      /**
       * Show the path params like {id} be allowed on class level?
       */
      debug(`Defining @Path ${path} for method  ${target.constructor?.name}.${propertyKey}`);

      if (path[0] !== "/") {
        path = "/" + path;
      }

      Reflect.defineMetadata(SYM_REQUEST_PATH, path, target, propertyKey);
    }
  }
}
