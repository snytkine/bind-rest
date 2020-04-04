import {
  IfIocComponent,
  IfIocContainer,
  stringifyIdentity,
  Maybe,
  isDefined,
  notEmpty,
  COMPONENT_META_DATA,
  StringToAny,
} from 'bind';
import HTTPMethod from 'http-method-enum';
import { IControllerDetails, IControllerParamMeta } from '../interfaces';
import {
  CONTROLLER_MATCHER,
  IS_CONTROLLER,
  SYM_CONTROLLER_MIDDLEWARES,
  SYM_METHOD_PARAMS,
  SYM_REQUEST_METHOD,
  SYM_REQUEST_PATH,
} from '../decorators/metaprops';
import { makeParamsValidator, makeValidateAsync } from './paramsvalidator';
import {
  ParamExtractor,
  MiddlewareFunc,
  IMiddlewareFactory,
  AsyncContextParamValidator,
  ControllerFunc,
} from '../types';
import Context from '../../components/context';
import ApplicationError from '../errors/applicationerror';
import { toMWFuncFactory } from '../decorators/middlewares';

const debug = require('debug')('promiseoft:runtime:controller');

const TAG = 'ControllerParser';

const joinPath = (base: string = '', callPath: string = '') => base + callPath;

export default function parseController(container: IfIocContainer) {
  return (component: IfIocComponent): Array<IControllerDetails> => {
    const id: string = stringifyIdentity(component.identity);

    if (!component.componentMetaData[IS_CONTROLLER]) {
      debug('%s Component "%s" not a controller', TAG, id);
      return [];
    }

    if (!component.identity.clazz) {
      throw new Error(`Controller class not found for id="${id}"`);
    }

    const o = component.identity.clazz?.prototype;
    if (!o) {
      throw new Error(`Controller class prototype not found for id="${id}"`);
    }

    const basePath = Reflect.getMetadata(SYM_REQUEST_PATH, component.identity.clazz) || '';
    debug('%s basePath for "%s" = "%s"', TAG, o.constructor.name, basePath);
    const props = Object.getOwnPropertyNames(o);

    return props
      .map((p) => {
        let ctrlWithMiddleware: ControllerFunc;
        let controllerMiddleware: MiddlewareFunc;
        const metaMethods: Maybe<Set<HTTPMethod>> = Reflect.getMetadata(SYM_REQUEST_METHOD, o, p);
        const metaData: StringToAny = Reflect.getMetadata(COMPONENT_META_DATA, o, p) || {};
        const paramsMeta: Array<IControllerParamMeta> =
          Reflect.getMetadata(SYM_METHOD_PARAMS, o, p) || [];

        const metaPath: string = Reflect.getMetadata(SYM_REQUEST_PATH, o, p) || '';
        const controllerName = `${component.identity?.clazz?.name}.${p}`;

        const aMiddlewares: Maybe<Array<IMiddlewareFactory>> = Reflect.getMetadata(
          SYM_CONTROLLER_MIDDLEWARES,
          o,
          p,
        );

        let controllerMiddlewareFactory: IMiddlewareFactory;

        if (Array.isArray(aMiddlewares) && aMiddlewares.length > 0) {
          /**
           * Create single middleware factory from array of middleware factories
           * Then create a middleware function.
           */
          controllerMiddlewareFactory = toMWFuncFactory(aMiddlewares);
          controllerMiddleware = controllerMiddlewareFactory(container);
        }

        /**
         * If have aMiddlewares then combine all middlewares
         * into a single MiddlewareFuncFactory
         */

        if (!isDefined(metaMethods)) {
          debug('%s Method "%s" is NOT a controller. Returning null!!!', TAG, controllerName);
          return null;
        }
        const methods: Array<HTTPMethod> = Array.from(metaMethods);

        const paramExtractors: Array<ParamExtractor> = paramsMeta.map((meta) => meta.f(container));
        const validators: Array<AsyncContextParamValidator> = paramsMeta.map((meta) => {
          if (meta.validator) {
            return meta.validator(container);
          }
          /**
           * If no .validator for this controller parameter
           * then generate a function that takes context and
           * returns a no-op function.
           */
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          return (ctx: Context) => (val) => undefined;
        });
        const validateParams = makeParamsValidator(paramsMeta, controllerName);

        /**
         * @todo
         * type: Array<any> => Array<any> or Throw ValidationError
         * ValidationError should have detailed error what did not validate
         * include paramName, paramIndex reason. Prefer Multiple validation errors
         * over throwing on single validation error.
         *
         * makeValidators can combine validating types and .required
         *
         * paramTypesValidator = paramsMeta.map(makeValidators)
         * validateRequired = paramsMeta.map(makeRequiredValidators)
         * customValidators = paramsMeta.map(makeCustomValidators)
         */
        const ctrl: ControllerFunc = (context: Context) => {
          Reflect.set(context, 'controllerName', controllerName);

          const validateAsync = makeValidateAsync(context, validators, controllerName);

          const oCtrl = component.get([context]);
          let futureParams: Promise<Array<any>>;
          if (paramExtractors.length > 0) {
            futureParams = Promise.all(paramExtractors.map((f) => f(context))).catch((e) => {
              debug('%s exception from futureParams %o', TAG, e);

              throw new ApplicationError(
                `Error Parsing request parameters
              Controller=${controllerName}
              Error=${e.message}`,
                e,
              );
            });
          } else {
            /**
             * For No-Arg controller it is necessary to have this.
             */
            futureParams = Promise.resolve([]);
          }

          /**
           * paramsExtractors may be empty array. Must check first
           */
          return futureParams
            .then(validateParams)
            .then(validateAsync)
            .then((validatedParams) => {
              /**
               * @todo here we can join array of controller arguments with
               * controller argument names. This is for logging and debugging only
               * the array of names and array of arguments can be added to context
               */
              Reflect.set(context, 'controllerArguments', validatedParams);

              return oCtrl[p](...validatedParams);
            });
        };

        /**
         * If there are any controllerMiddleware for this controller
         * then run it first
         * and then run actual controller.
         */
        if (controllerMiddleware) {
          debug('%s adding controller middleware for controller="%s"', TAG, controllerName);
          ctrlWithMiddleware = (context: Context) => {
            return controllerMiddleware(context).then(ctrl);
          };
        }

        /**
         * if there is a matcher function
         * the priority should be greater than 0
         * so that this specific controller will be tested for match first,
         * otherwise the default matcher in other controller will match
         * and if other component for the same route has same or higher priority
         * it will match first, this controller will never be tested for a match.
         */

        const priority = isDefined(metaData[CONTROLLER_MATCHER]) ? 1 : 0;

        return {
          name: controllerName,
          requestMethods: methods,
          routePath: joinPath(basePath, metaPath),
          ctrl: ctrlWithMiddleware || ctrl,
          matcher: metaData[CONTROLLER_MATCHER],
          priority,
        };
      })
      .filter(notEmpty);
  };
}
