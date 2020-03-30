import { SYM_JSON_SCHEMA } from './metaprops';
import { Constructor } from 'bind';

const debug = require('debug')('promiseoft:decorators');

const TAG = '@JsonSchema';

export function JsonSchema(schema: Object) {


  /**
   * Make sure that schema is an object and has some properties
   * @todo validate that schema is actually a valid json schema object
   * this can probably be done by calling schema validator constructor
   * and checking that validator created correctly.
   */
  if (schema===null || typeof schema!=='object') {
    throw new Error(`${TAG} schema must be an Object (a valid json schema). Check your classes annotated with ${TAG} and make sure the parameter is an object`);
  }

  return function (target: Constructor<any>) {

    /**
     * @todo remove these 4 lines
     */
    const x = require;
    const y = module;
    debug(x.name);
    debug(y.filename);

    debug('Defining %s for class %s', TAG, target.name);

    let type = Reflect.getMetadata(SYM_JSON_SCHEMA, target);
    if (type) {
      throw new Error(`Cannot add ${TAG} decorator to Class '${target.name}' because it is already decorated with '${TAG}'`);
    }

    Reflect.defineMetadata(SYM_JSON_SCHEMA, schema, target);
  };

}
