import { PathDetailsType } from '../../enums';
import { RequestContext } from '../../../components';
import { JSON_VALIDATOR } from '../../consts';
import { PARAM_TYPES, SYM_JSON_SCHEMA, SYM_METHOD_PARAMS } from '../metaprops';
import inflate from 'inflation';
import raw from 'raw-body';
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
import JsonSchemaValidator from '../../../components/jsonschemavalidator';
import {
  getMethodParamName,
  Identity,
  IfIocContainer,
  Target,
  ClassPrototype,
  isDefined,
} from 'bind';


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


export function Container(target: ClassPrototype,
                          propertyKey: string,
                          parameterIndex: number) {

  const factory = (c: IfIocContainer) => (context: RequestContext) => c;

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.QueryString,
    factory);
}

export function QueryString(target: ClassPrototype,
                            propertyKey: string,
                            parameterIndex: number) {

  const factory = (c: IfIocContainer) => (context: RequestContext) => context.querystring;

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.QueryString,
    factory);
}

export function Cookies(target: ClassPrototype,
                        propertyKey: string,
                        parameterIndex: number) {

  const factory = (c: IfIocContainer) => (context: RequestContext) => context.parsedCookies;

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.QueryString,
    factory);
}

export function ParsedQuery(target: ClassPrototype,
                            propertyKey: string,
                            parameterIndex: number) {

  const factory = (c: IfIocContainer) => (context: RequestContext) => context.parsedUrlQuery;

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.Query,
    factory);
}


export function Headers(target: ClassPrototype,
                        propertyKey: string,
                        parameterIndex: number) {

  const factory = (c: IfIocContainer) => (context: RequestContext) => context.req.headers;

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.Headers,
    factory);
}


export function Router(target: ClassPrototype,
                       propertyKey: string,
                       parameterIndex: number) {

  const paramFactory = (c: IfIocContainer) => {
    return (context: RequestContext): Promise<HttpRouter<FrameworkController>> => {
      return c.getComponent(Identity(HttpRouter), [context]);
    };
  };

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.HttpRouter,
    paramFactory);
}

export function UriInfo(target: ClassPrototype,
                        propertyKey: string,
                        parameterIndex: number) {

  const factory = (c: IfIocContainer) => (context: RequestContext) => context.parsedUrl;

  return applySingleAnnotation(target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.UriInfo,
    factory);
}

export function Request(target: ClassPrototype,
                        propertyKey: string,
                        parameterIndex: number) {
  const factory = (c: IfIocContainer) => (context: RequestContext) => context.req;

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.Request,
    factory,
  );
}


export function Response(target: ClassPrototype,
                         propertyKey: string,
                         parameterIndex: number) {
  const factory = (c: IfIocContainer) => (context: RequestContext) => context.res;

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.Response,
    factory,
  );
}


export function Context(target: ClassPrototype,
                        propertyKey: string,
                        parameterIndex: number) {
  const factory = (c: IfIocContainer) => (context: RequestContext) => context;

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.Context,
    factory,
  );
}


export function ContextStore(target: ClassPrototype,
                             propertyKey: string,
                             parameterIndex: number) {
  const factory = (c: IfIocContainer) => (context: RequestContext) => context.storage;

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.ContextScope,
    factory,
  );
}


export function RequestMethod(target: ClassPrototype,
                              propertyKey: string,
                              parameterIndex: number) {

  const factory = (c: IfIocContainer) => (context: RequestContext) => context.req.method;

  return applySingleAnnotation(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.RequestMethod,
    factory,
  );
}


export function Body(target: ClassPrototype,
                     propertyKey: string,
                     parameterIndex: number) {

  const paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);
  const controllerName = `${target.constructor.name}.${propertyKey}`;

  const paramType = getParamType(paramTypes, parameterIndex);
  if (paramType===PARAM_TYPE_PROMISE) {
    throw new Error(`Invalid argument type ${controllerName}
        for argument ${parameterIndex}
        @Body param cannot be of type Promise.`);
  }


  const paramFactory = (c: IfIocContainer) => (context: RequestContext) => {

    let jsonSchema;
    const application: Application = c.getComponent(Identity(APPLICATION_COMPONENT));
    const enableSchemaValidation = application?.settings?.validation?.jsonSchema;
    /**
     * If paramType is component decorated with JsonSchema then validate schema.
     */
    if (typeof paramType!=='string') {
      jsonSchema = Reflect.getMetadata(SYM_JSON_SCHEMA, paramType);
      debug('%s jsonSchema=%o', TAG, jsonSchema);
    }

    /**
     * If RequestMethod is NOT PUT or POST throw error here because
     * cannot have @Body decorator for other methods.
     */
    /**
     * @todo this guard may be unnecessary
     * basically we are guarding against the case that someone
     * will put @RequestBody annotation on a controller method that is not for POST or PUT
     * It's better that we check for this when parsing the controller annotations GET or DELETE
     * to make sure there are no body parsing in there.
     *
     * @type {[string,string]}
     */
    let allowedMethods = ['PUT', 'POST'];
    if (!allowedMethods.includes(context.req.method)) {
      throw new HttpError(HTTP_STATUS_CODES.BAD_REQUEST,
        `Error in controller ${controllerName}
        argument ${parameterIndex}
  Error: Cannot extract @Body from Request.
  Reason: request method "${context.req.method}" cannot include request body`);
    }

    /**
     * @todo get value of options from
     * 1. Look in the request, extract encoding part
     * 2. Get instance of Application.config and look for body.encoding
     * 3. default to utf-8
     */
      //const options: IBodyParserOptions = { encoding: 'utf-8' };
    let contentType;
    /**
     * Use content-type header
     */
    if (context.req.headers['content-type'] &&
      typeof context.req.headers['content-type']==='string') {
      contentType = context.req.headers['content-type'].toLowerCase();
    }


    /**
     * @todo if NOT json but have bodyPrototype
     * then throw Error because param has to be an instance of specific class
     * but in order for this to work the body must be sent as json and it's
     * the responsibility of client to set correct content-type header
     */

    /**
     * @todo set options from application settings
     * as settings.zlib
     * @todo also have option to disable support for zlib compression
     * and check for the flag here before attempting to decompress.
     */

    let parsed: Promise<any> = raw(inflate(context.req))
      .then((rawBody): String => String(rawBody))
      .then(body => body.valueOf());

    /**
     * parse as json ONLY if context-type is JSON or
     * the type is set to custom class that has JsonSchema
     *
     * What if context-type is JSON but in controller method user specifically
     * set to : string or : number or : boolean ?
     * in case of boolean, string and number the setParamType() will generate Error
     * in case of Array will set to Array if parse json is an array.
     */
    if (contentType.startsWith(CONTENT_TYPE_JSON) || jsonSchema) {
      parsed = parsed.then(body => JSON.parse(body)).catch(e => {
        throw new HttpError(HTTP_STATUS_CODES.BAD_REQUEST,
          `Failed to parse request body in controller
        "${controllerName}" for argument ${parameterIndex}
        error=${e.message}`);
      });
    }

    if (jsonSchema && enableSchemaValidation) {
      const validator: JsonSchemaValidator = c.getComponent(Identity(JSON_VALIDATOR));

      parsed = parsed.then(body => {
        const res = validator.validate(
          body,
          jsonSchema,
          `Error parsing parameter "${getMethodParamName(target, propertyKey, parameterIndex)}"
          (argument ${parameterIndex})
          in controller ${controllerName}`);

        if (isDefined(res)) {
          throw res;
        }

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

