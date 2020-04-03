import { PathDetailsType } from '../../enums';
import { RequestContext } from '../../../components';
import { PARAM_TYPES, SYM_JSON_SCHEMA, SYM_METHOD_PARAMS } from '../metaprops';
import {
  CONTENT_TYPE_JSON,
  PARAM_TYPE_ARRAY,
  PARAM_TYPE_BOOLEAN,
  PARAM_TYPE_NUMBER,
  PARAM_TYPE_OBJECT,
  PARAM_TYPE_PROMISE,
  PARAM_TYPE_STRING,
  APPLICATION_COMPONENT,
} from '../../consts';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import { IControllerParamMeta } from '../../interfaces';
import { HttpRouter } from 'holiday-router';
import FrameworkController from '../../core/frameworkcontroller';
import { HttpError } from '../../errors';
import HTTP_STATUS_CODES from 'http-status-enum';
import { Application } from '../../core';

import {
  getMethodParamName,
  Identity,
  IfIocContainer,
  Target,
  ClassPrototype,
} from 'bind';
import { parseBody, parseJsonBody } from '../../utils';
import makeParamDecorator from './makeparamdecorator';

const debug = require('debug')('promiseoft:decorators');
const TAG = 'NO_ARG_METHOD_DECORATOR';

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


export function applySingleAnnotation(target: Target,
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
      on method ${target.constructor?.name}.${propertyKey}`);
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

export function Required(target: ClassPrototype,
                         propertyKey: string,
                         parameterIndex: number) {

  return applySingleAnnotation(target, propertyKey, parameterIndex, true);
}

export function Body(target: ClassPrototype,
                     propertyKey: string,
                     parameterIndex: number) {

  const paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);
  const controllerName = `${target.constructor.name}.${propertyKey}`;
  const paramName = getMethodParamName(target, propertyKey, parameterIndex);

  const paramType = getParamType(paramTypes, parameterIndex);
  if (paramType===PARAM_TYPE_PROMISE) {
    throw new Error(`Invalid argument type ${controllerName} 
    paramName="${paramName}" (argument ${parameterIndex})
        @Body param cannot be of type Promise.`);
  }


  const paramFactory = (c: IfIocContainer) => (context: RequestContext) => {

    let jsonSchema;
    const application: Application = c.getComponent(Identity(APPLICATION_COMPONENT));
    const enableSchemaValidation = application?.settings?.validation?.jsonSchema;

    /**
     * If paramType is component decorated with JsonSchema then validate schema.
     */
    if (
      enableSchemaValidation &&
      paramType!==PARAM_TYPE_STRING &&
      paramType!==PARAM_TYPE_BOOLEAN &&
      paramType!==PARAM_TYPE_NUMBER
    ) {
      jsonSchema = Reflect.getMetadata(SYM_JSON_SCHEMA, paramType);
      debug('%s jsonSchema=%o', TAG, jsonSchema);
    }

    let contentType: string;
    /**
     * Use content-type header
     */
    if (context.req.headers['content-type'] &&
      typeof context.req.headers['content-type']==='string') {
      contentType = context.req.headers['content-type'].toLowerCase();
    }

    let parsed: Promise<any>;

    if (contentType.startsWith(CONTENT_TYPE_JSON) || jsonSchema) {
      parsed = parseJsonBody(context.req, jsonSchema);
    } else {
      parsed = parseBody(context.req);
    }

    return parsed.catch(e => {

      throw new HttpError(HTTP_STATUS_CODES.BAD_REQUEST,
        `Failed to parse request body.
        Controller="${controllerName}" 
        Parameter="${paramName}" (argument ${parameterIndex})
        Error=${e.message}
        `);
    });
  };

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.RequestBody,
    paramFactory);
}


export const QueryString = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.querystring,
);

export const Cookies = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.parsedCookies,
);

export const ParsedQuery = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.parsedUrlQuery,
);

export const Headers = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.req.headers,
);

export const Router = makeParamDecorator(
  (c: IfIocContainer) => {
    /**
     * Here we get componentDetails from container at the invocation
     * of the first function. This way if component is not found
     * the exception will be thrown at the initialization stage
     * and not at runtime.
     */
    const componentDetails = c.getComponentDetails(Identity(HttpRouter));

    return (context: RequestContext): Promise<HttpRouter<FrameworkController>> => {
      return componentDetails.get([context]);
    };
  },
);


export const UriInfo = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.parsedUrl,
);


export const Request = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.req,
);

export const Response = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.res,
);

export const Container = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => c,
);

export const Context = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context,
);

export const ContextStore = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.storage,
);

export const RequestMethod = makeParamDecorator(
  (c: IfIocContainer) => (context: RequestContext) => context.req.method,
);

/**
 * BodyParam users a makeParamDecorator function to make custom
 * param decorator.
 * This technique can be used to create any custom param decorator
 * makeParamDecorator is called with no argument here and that is why
 * the return value is a IParamDecoratorFactory and not the actual paramdecorator function.
 */
export const BodyParam = makeParamDecorator();

