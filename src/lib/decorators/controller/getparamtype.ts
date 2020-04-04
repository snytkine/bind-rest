import {
  PARAM_TYPE_ARRAY,
  PARAM_TYPE_BOOLEAN,
  PARAM_TYPE_NUMBER,
  PARAM_TYPE_OBJECT,
  PARAM_TYPE_PROMISE,
  PARAM_TYPE_STRING,
} from '../../consts';

const getParamType = (paramTypes: Array<any>, index: number): string | object | undefined => {
  let ret;

  if (paramTypes[index] && typeof paramTypes[index] === 'function') {
    switch (paramTypes[index].name) {
      case 'String':
        ret = PARAM_TYPE_STRING;
        break;

      case 'Number':
        ret = PARAM_TYPE_NUMBER;
        break;

      case 'Boolean':
        ret = PARAM_TYPE_BOOLEAN;
        break;

      case 'Array':
        ret = PARAM_TYPE_ARRAY;
        break;

      case 'Object':
        /**
         * No type was specified for this body parameter
         * Typescript defaults to generic Object
         */
        ret = PARAM_TYPE_OBJECT;
        break;

      case 'Promise':
        ret = PARAM_TYPE_PROMISE;
        break;

      default:
        ret = paramTypes[index];
    }
  }

  return ret;
};

export default getParamType;
