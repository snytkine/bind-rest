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

const debug = require('debug')('bind:rest:decorators');

const TAG = 'NO_ARG_METHOD_DECORATOR';

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

  /* eslint-disable  @typescript-eslint/no-unused-vars */
  const paramFactory = (c: IfIocContainer) => {
    const enableSchemaValidation = true;
    // const application: Application = c.getComponent(Identity(APPLICATION_COMPONENT));

    return function BodyExtractor(context: IBindRestContext) {
      /**
       * @todo this was supposed to be a way to turn off schema validation
       * in a running application, even if @Body type of request param
       * already had object with @JsonSchema decoration.
       *
       *
       */
      // const enableSchemaValidation = application.settings?.validation?.jsonSchema;
      let jsonSchema;

      // debug('%s in Body paramFactory enableSchemaValidation=%s', TAG, enableSchemaValidation);
      /**
       * If paramType is component decorated with JsonSchema then validate schema.
       */
      if (
        enableSchemaValidation &&
        paramType !== PARAM_TYPE_STRING &&
        paramType !== PARAM_TYPE_BOOLEAN &&
        paramType !== PARAM_TYPE_OBJECT &&
        paramType !== PARAM_TYPE_NUMBER
      ) {
        try {
          jsonSchema = Reflect.getMetadata(SYM_JSON_SCHEMA, paramType);
        } catch (e) {
          debug('%s exception from getMetadata of paramType=%o error %o', TAG, paramType, e);
        }
        debug('%s jsonSchema=%o', TAG, jsonSchema);
      }

      let contentType: string;
      /**
       * Use content-type header
       */
      debug('%s trying to get request content-type', TAG);
      if (
        context.requestHeaders?.['content-type'] &&
        typeof context.requestHeaders['content-type'] === 'string'
      ) {
        contentType = context.requestHeaders['content-type'].toLowerCase();
      }

      debug('%s in Body parser. contentType=%s', TAG, contentType);
      let parsed: Promise<any>;

      if (contentType.startsWith(CONTENT_TYPE_JSON) || jsonSchema) {
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
