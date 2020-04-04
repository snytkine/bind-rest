import { HttpRouter } from 'holiday-router';
import HTTP_STATUS_CODES from 'http-status-enum';
import { getMethodParamName, Identity, IfIocContainer, ClassPrototype } from 'bind';
import { PathDetailsType } from '../../enums/pathdetails';
import { RequestContext } from '../../../components';
import { PARAM_TYPES, SYM_JSON_SCHEMA } from '../metaprops';
import {
  CONTENT_TYPE_JSON,
  PARAM_TYPE_ARRAY,
  PARAM_TYPE_BOOLEAN,
  PARAM_TYPE_NUMBER,
  PARAM_TYPE_OBJECT,
  PARAM_TYPE_PROMISE,
  PARAM_TYPE_STRING,
} from '../../consts/controllermethodparams';
import FrameworkController from '../../core/frameworkcontroller';
import { HttpError } from '../../errors';
import { Application } from '../../core/application';

import { parseBody, parseJsonBody } from '../../utils';
import makeParamDecorator from './makeparamdecorator';
import applyNoParamDecorator from './applysingledecorator';
import { APPLICATION_COMPONENT } from '../../consts/appcomponents';

const debug = require('debug')('promiseoft:decorators');

const TAG = 'NO_ARG_METHOD_DECORATOR';

export const getParamType = (
  paramTypes: Array<any>,
  index: number,
): string | object | undefined => {
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

export function Required(target: ClassPrototype, propertyKey: string, parameterIndex: number) {
  return applyNoParamDecorator(target, propertyKey, parameterIndex, true);
}

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

  const paramFactory = (c: IfIocContainer) => (context: RequestContext) => {
    let jsonSchema;
    const application: Application = c.getComponent(Identity(APPLICATION_COMPONENT));
    const enableSchemaValidation = application?.settings?.validation?.jsonSchema;

    /**
     * If paramType is component decorated with JsonSchema then validate schema.
     */
    if (
      enableSchemaValidation &&
      paramType !== PARAM_TYPE_STRING &&
      paramType !== PARAM_TYPE_BOOLEAN &&
      paramType !== PARAM_TYPE_NUMBER
    ) {
      jsonSchema = Reflect.getMetadata(SYM_JSON_SCHEMA, paramType);
      debug('%s jsonSchema=%o', TAG, jsonSchema);
    }

    let contentType: string;
    /**
     * Use content-type header
     */
    if (
      context.req.headers['content-type'] &&
      typeof context.req.headers['content-type'] === 'string'
    ) {
      contentType = context.req.headers['content-type'].toLowerCase();
    }

    let parsed: Promise<any>;

    if (contentType.startsWith(CONTENT_TYPE_JSON) || jsonSchema) {
      parsed = parseJsonBody(context.req, jsonSchema);
    } else {
      parsed = parseBody(context.req);
    }

    return parsed.catch((e) => {
      throw new HttpError(
        HTTP_STATUS_CODES.BAD_REQUEST,
        `Failed to parse request body.
        Controller="${controllerName}" 
        Parameter="${paramName}" (argument ${parameterIndex})
        Error=${e.message}
        `,
      );
    });
  };

  return applyNoParamDecorator(
    target,
    propertyKey,
    parameterIndex,
    false,
    PathDetailsType.RequestBody,
    paramFactory,
  );
}

export const QueryString = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.querystring,
);

export const Cookies = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.parsedCookies,
);

export const ParsedQuery = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.parsedUrlQuery,
);

export const Headers = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.req.headers,
);

export const Router = makeParamDecorator((c: IfIocContainer) => {
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
});

export const UriInfo = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.parsedUrl,
);

export const Request = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.req,
);

export const Response = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.res,
);

export const Container = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) => c);

export const Context = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context,
);

export const ContextStore = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.storage,
);

export const RequestMethod = makeParamDecorator((c: IfIocContainer) => (context: RequestContext) =>
  context.req.method,
);

/**
 * BodyParam users a makeParamDecorator function to make custom
 * param decorator.
 * This technique can be used to create any custom param decorator
 * makeParamDecorator is called with no argument here and that is why
 * the return value is a IParamDecoratorFactory and not the actual paramdecorator function.
 */
export const BodyParam = makeParamDecorator();
