import { HttpRouter } from 'holiday-router';
import { getMethodParamName, Identity, IfIocContainer, ClassPrototype, PARAM_TYPES } from 'bind-di';
import ControllerParamType from '../../enums/controllerparamtype';
import { SYM_JSON_SCHEMA } from '../metaprops';
import {
  CONTENT_TYPE_JSON,
  PARAM_TYPE_BOOLEAN,
  PARAM_TYPE_NUMBER,
  PARAM_TYPE_OBJECT,
  PARAM_TYPE_PROMISE,
  PARAM_TYPE_STRING,
} from '../../consts/controllermethodparams';
import FrameworkController from '../../core/frameworkcontroller';

import { parseBody, parseJsonBody } from '../../utils/parsebody';
import makeParamDecorator from './makeparamdecorator';
import applyNoParamDecorator from './applysingledecorator';
import getParamType from './getparamtype';
import BadRequestError from '../../errors/http/badrequest';
import { IBindRestContext } from '../../interfaces/icontext';
import HEADER_NAMES from '../../consts/headernames';

const debug = require('debug')('bind:rest:decorators');

const TAG = 'NO_ARG_METHOD_DECORATOR';

export function Required(target: ClassPrototype, propertyKey: string, parameterIndex: number) {
  return applyNoParamDecorator(target, propertyKey, parameterIndex, true);
}

/**
 * Logic for parsing @Body decorated param:
 * If param type is: string | number | boolean
 * then just turn that body into a string (later a function will attemp
 * to convert that string into desired type)
 *
 *
 * If param type is some custom class (not just Object) then try to see get JsonSchema from that class
 * If class had @JsonSchema decorator attached then:
 * 1. Body must be first parsed into string, then into json
 * 2. result object must validate against Json Schema
 *
 * If there is a request header 'content-type' that starts with application/json
 * AND explicit type is NOT a primitive type then attempt to convert body
 * into Json object.
 *
 * @param target
 * @param propertyKey
 * @param parameterIndex
 * @constructor
 */
export function Body(target: ClassPrototype, propertyKey: string, parameterIndex: number) {
  const paramTypes = Reflect.getMetadata(PARAM_TYPES, target, propertyKey);
  const controllerName = `${target.constructor.name}.${propertyKey}`;
  const paramName = getMethodParamName(target, propertyKey, parameterIndex);

  const paramType = getParamType(paramTypes, parameterIndex);
  if (paramType === PARAM_TYPE_PROMISE) {
    throw new Error(`Invalid argument type ${controllerName} 
    paramName="${paramName}" (argument ${parameterIndex})
        @Body param cannot be of type Promise.`);
  }

  const primitiveType =
    paramType === PARAM_TYPE_STRING ||
    paramType === PARAM_TYPE_BOOLEAN ||
    paramType === PARAM_TYPE_NUMBER;

  const shouldJsonParseBody: boolean = !primitiveType && paramType !== PARAM_TYPE_OBJECT;
  debug(
    '%s Body decorator. propertyKey=%s parameterInded=%s primitiveType=%s shouldJsonParseBody=%s',
    TAG,
    propertyKey,
    parameterIndex,
    primitiveType,
    shouldJsonParseBody,
  );

  /* eslint-disable  @typescript-eslint/no-unused-vars */
  const paramFactory = (c: IfIocContainer) => {
    return function BodyExtractor(context: IBindRestContext) {
      let jsonSchema;

      /**
       * If paramType is component decorated with JsonSchema then validate schema.
       */
      if (shouldJsonParseBody) {
        try {
          jsonSchema = Reflect.getMetadata(SYM_JSON_SCHEMA, paramType);
        } catch (e) {
          debug('%s exception from getMetadata of paramType=%o error %o', TAG, paramType, e);
        }
        debug('%s jsonSchema=%o', TAG, jsonSchema);
      }
      /**
       * Use content-type header
       */
      debug('%s trying to get request content-type', TAG);
      const contentType: string =
        context.requestHeaders?.[HEADER_NAMES.CONTENT_TYPE]?.toLowerCase() || '';

      debug('%s in Body parser. contentType=%s', TAG, contentType);
      let parsed: Promise<any>;

      /**
       * If content-type header says its application/json
       * then parse body into json object
       *
       * otherwise just turn into a string.
       */

      if ((!primitiveType && contentType.startsWith(CONTENT_TYPE_JSON)) || jsonSchema) {
        debug('%s will parseJsonBody', TAG);
        parsed = parseJsonBody(context, jsonSchema);
      } else {
        debug('%s will parse plain body', TAG);
        parsed = parseBody(context);
      }

      return parsed.catch((err) => {
        debug('%s ERROR parsing body %o', TAG, err);

        throw new BadRequestError(
          `Failed to parse request body.
        Controller="${controllerName}" 
        Parameter="${paramName}" (argument ${parameterIndex})
        Error=${err.message}
        `,
          err,
        );
      });
    };
  };

  return applyNoParamDecorator(
    target,
    propertyKey,
    parameterIndex,
    false,
    ControllerParamType.Body,
    paramFactory,
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const QueryString = makeParamDecorator((c: IfIocContainer) => (context: IBindRestContext) =>
  context.querystring,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Cookies = makeParamDecorator((c: IfIocContainer) => (context: IBindRestContext) =>
  context.parsedCookies,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ParsedQuery = makeParamDecorator((c: IfIocContainer) => (context: IBindRestContext) =>
  context.parsedUrlQuery,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Headers = makeParamDecorator((c: IfIocContainer) => (context: IBindRestContext) =>
  context.requestHeaders,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Router = makeParamDecorator((c: IfIocContainer) => {
  /**
   * Here we get componentDetails from container at the invocation
   * of the first function. This way if component is not found
   * the exception will be thrown at the initialization stage
   * and not at runtime.
   */
  const componentDetails = c.getComponentDetails(Identity(HttpRouter));

  return (context: IBindRestContext): Promise<HttpRouter<FrameworkController>> => {
    return componentDetails.get([context]);
  };
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Request = makeParamDecorator((c: IfIocContainer) => (context: IBindRestContext) =>
  context.req,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BindContainer = makeParamDecorator(
  (c: IfIocContainer) => (context: IBindRestContext) => c,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Context = makeParamDecorator((c: IfIocContainer) => (context: IBindRestContext) =>
  context,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ContextStore = makeParamDecorator((c: IfIocContainer) => (context: IBindRestContext) =>
  context.storage,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const RequestMethod = makeParamDecorator(
  (c: IfIocContainer) => (context: IBindRestContext) => context.requestMethod,
);

/**
 * BodyParam users a makeParamDecorator function to make custom
 * param decorator.
 * This technique can be used to create any custom param decorator
 * makeParamDecorator is called with no argument here and that is why
 * the return value is a IParamDecoratorFactory and not the actual paramdecorator function.
 */
export const BodyParam = makeParamDecorator();
