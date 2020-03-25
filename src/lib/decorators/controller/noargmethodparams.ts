import { PathDetailsType } from '../../enums';
import { Target, IfIocContainer, getMethodParamName } from 'bind';
import Context from '../../../components/context';
import { PARAM_TYPES, SYM_METHOD_PARAMS } from '../metaprops';
import inflate from 'inflation';
import raw from 'raw-body';
import {
  CONTENT_TYPE_JSON, PARAM_TYPE_ARRAY,
  PARAM_TYPE_BOOLEAN,
  PARAM_TYPE_NUMBER,
  PARAM_TYPE_OBJECT,
  PARAM_TYPE_PROMISE,
  PARAM_TYPE_STRING,
} from '../../consts/controllermethodparams';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import { IControllerParamMeta } from '../../interfaces';

const debug = require('debug')('promiseoft:decorators');

export interface IBodyParserOptions {
  length?: number
  limit?: number
  encoding: string
}

export const getParamType = (paramTypes: Array<any>, index: number): string | object | undefined => {
  let ret = undefined;

  if (paramTypes[index] && typeof paramTypes[index]==='function') {

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


function applySingleAnnotation(target: Target,
                               propertyKey: string,
                               parameterIndex: number,
                               required: boolean = false,
                               methodParamType?: PathDetailsType,
                               paramFactory?: ParamExtractorFactory,
) {

  const paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);
  /**
   *  Array of objects of PathDetailsParam
   *  This array gets new element each time this function is run on
   *  the same method which is the case where multiple arguments of the method
   *  are annotated with @PathParam
   */
  let metaDetails: Array<IControllerParamMeta> = Reflect.getMetadata(SYM_METHOD_PARAMS,
    target,
    propertyKey) || [];


  if (metaDetails[parameterIndex]) {

    /**
     * This may be a the case when element so has @Required decorator
     * in which case this method will be called twice.
     * But calling this method twice with different values of .name and .type is not allowed
     */
    if (metaDetails[parameterIndex].f && paramFactory) {
      throw new Error(`Method parameter ${parameterIndex} already defined 
      on method ${target.constructor.name}.${String(propertyKey)}`);
    }

    /**
     * If this was adding @Required to existing details then just add required.true to it
     */
    if (required) {
      metaDetails[parameterIndex].isRequired = required;
    } else {

      /**
       * If this the .required was added first then instead
       * add other values from passed methodArgumentDetails
       */
      metaDetails[parameterIndex].f = paramFactory;
      metaDetails[parameterIndex].paramDecoratorType = methodParamType;
      metaDetails[parameterIndex].paramType = getParamType(paramTypes, parameterIndex);
      metaDetails[parameterIndex].paramName = getMethodParamName(target, propertyKey, parameterIndex);
    }
  } else {

    /**
     * @todo check that position of last element is == parameterIndex-1
     *        If it's not, then it would mean that there is one or more un-annotated params,
     *        in which case there will be a gap in the array, ie: elements with keys 0,1 but now adding paramIndex 3
     *        Currently JavaScript is fine with this and will just fill the gap with null
     *        Maybe we can be extra careful and just insert null for missing elements. Just to be sure.
     *
     *        Later if we want to add support for non-decorated parameters based on types
     *        We will be able to fill in the missing elements in the controller parser when we extract
     *        design:type for parameters
     *
     *        But probably support for undecorated parameters is not a good idea.
     *        If we know for sure that undecorated parameters are not supported
     *        then we can detect this gap in array here and throw an Error.
     *        At least it will be thrown at initialization time.
     *
     * @type {{type: PathDetailsType, name: string, position: number}}
     */
    metaDetails[parameterIndex] = {
      f: paramFactory,
      isRequired: required,
      paramDecoratorType: methodParamType,
      paramType: getParamType(paramTypes, parameterIndex),
      paramName: getMethodParamName(target, propertyKey, parameterIndex),
    };
  }
  /**
   * Now set SYM_METHOD_PARAMS meta of this method with metaDetails value
   */
  Reflect.defineMetadata(SYM_METHOD_PARAMS, metaDetails, target, propertyKey);
}

export function Required(target: Target,
                         propertyKey: string,
                         parameterIndex: number) {

  return applySingleAnnotation(target, propertyKey, parameterIndex, true);
}

export function QueryString(target: Target,
                            propertyKey: string,
                            parameterIndex: number) {

  const paramFactory = (c: IfIocContainer) => (context: Context) => {
    return Promise.resolve(context.querystring);
  };

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.QueryString,
    paramFactory);
}

export function ParsedQuery(target: Target,
                            propertyKey: string,
                            parameterIndex: number) {

  const paramFactory = (c: IfIocContainer) => (context: Context) => {
    return Promise.resolve(context.parsedUrlQuery);
  };

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.Query,
    paramFactory);
}


export function Headers(target: Target,
                        propertyKey: string,
                        parameterIndex: number) {

  const paramFactory = (c: IfIocContainer) => (context: Context) => {
    return Promise.resolve(context.req.headers);
  };

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.Headers,
    paramFactory);
}


export function RequestMethod(target: Target,
                              propertyKey: string,
                              parameterIndex: number) {

  const paramFactory = (c: IfIocContainer) => (context: Context) => {
    return Promise.resolve(context.req.method);
  };

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.RequestMethod,
    paramFactory
  );
}


export function Body(target: Target,
                     propertyKey: string,
                     parameterIndex: number) {

  const paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);
  let bodyType;
  let bodyPrototype;

  const paramType = getParamType(paramTypes, parameterIndex);
  if (paramType===PARAM_TYPE_PROMISE) {
    throw new Error(`Invalid argument type ${target.constructor?.name}.${propertyKey}
        for argument ${parameterIndex}
        @Body param cannot be of type Promise.`);
  }

  switch (paramType) {
    case PARAM_TYPE_STRING:
      bodyType = 'string';
      break;

    case PARAM_TYPE_NUMBER:
      bodyType = 'number';
      break;

    case PARAM_TYPE_OBJECT:
      /**
       * No type was specified for this body parameter
       * Typescript defaults to generic Object
       */
      break;

    default:
      bodyPrototype = paramTypes[parameterIndex];
  }


  const paramFactory = (c: IfIocContainer) => (context: Context) => {

    const options: IBodyParserOptions = { encoding: 'utf-8' };
    let contentType;
    /**
     * Use content-type header
     */
    if (context.req.headers['content-type'] &&
      typeof context.req.headers['content-type']==='string') {
      contentType = context.req.headers['content-type'].toLowerCase();
    }

    if (contentType===CONTENT_TYPE_JSON) {
      bodyType = CONTENT_TYPE_JSON;
    }


    /**
     * @todo if bodyType is NOT json but have bodyPrototype
     * then throw Error because param has to be an instance of specific class
     * but in order for this to work the body must be sent as json and it's
     * the responsibility of client to set correct content-type header
     */
    let len = context.req.headers['content-length'];
    let encoding = context.req.headers['content-encoding'] || 'identity';
    if (len && encoding==='identity') {
      options.length = ~~len;
    }

    options.encoding = this.options.encoding || 'utf-8';
    /**
     * @todo set options.limit from process.env.MAX_REQUEST_BODY
     * formatBytes('4mb') where '4mb' can be set from env
     */
    let parsed = raw(inflate(context.req), options)
      .then((rawBody): String => String(rawBody))
      .then(body => body.valueOf());

    if (bodyPrototype===CONTENT_TYPE_JSON || bodyPrototype) {
      parsed = parsed.then(body => JSON.parse(body)).catch(e => {
        throw new Error(`Failed to parse request body in controller
        ${target.constructor?.name}.${propertyKey} for argument ${parameterIndex}`);
      });
    }

    if (bodyPrototype) {
      parsed = parsed.then(body => {
        Reflect.setPrototypeOf(body, bodyPrototype);

        return body;
      });

    }

    return parsed;

  };

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.RequestBody,
    paramFactory);
}

