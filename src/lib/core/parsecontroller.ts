import {
  IfIocComponent,
  IfIocContainer,
  stringifyIdentity,
  Maybe,
  isDefined,
  notEmpty,
} from 'bind';
import {
  ControllerDetails,
  ControllerFunc,
  IControllerParamMeta,
} from '../interfaces';
import {
  IS_CONTROLLER,
  SYM_CONTROLLER_MIDDLEWARES,
  SYM_METHOD_PARAMS,
  SYM_REQUEST_METHOD,
  SYM_REQUEST_PATH,
} from '../decorators';
import { RequestMethod } from '../enums/requestmethods';
import { MiddlewareFunc, MiddlewareFuncFactory } from '../types';
import { ParamExtractor } from '../types/controllerparamextractor';
import Context from './context';

const debug = require('debug')('promiseoft:runtime:controller');
const TAG = 'ControllerParser';

const joinPath = (base: string = '', callPath: string = '') => base + callPath;

export function parseController(container: IfIocContainer) {

  return (component: IfIocComponent): Array<ControllerDetails> => {
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
    debug(`basePath for ${o.constructor.name}: ${basePath}`);
    const props = Object.getOwnPropertyNames(o);

    return props.map(p => {
      let ctrl: ControllerFunc;
      let ctrlWithMiddleware: ControllerFunc;
      let methods: Array<RequestMethod>;
      let middleware: MiddlewareFunc;
      let metaMethods: Maybe<Set<RequestMethod>> = Reflect.getMetadata(SYM_REQUEST_METHOD, o, p);
      let paramsMeta: Array<IControllerParamMeta> = Reflect.getMetadata(SYM_METHOD_PARAMS, o, p) || [];
      const metaPath: string = Reflect.getMetadata(SYM_REQUEST_PATH, o, p) || '';
      const controllerName = `${component.identity.clazz.name}.${p}`;
      let controllerMiddleware: Maybe<MiddlewareFuncFactory> = Reflect.getMetadata(SYM_CONTROLLER_MIDDLEWARES, o, p);

      if (!isDefined(metaMethods)) {
        debug('%s Method "%s" is NOT a controller', TAG, controllerName);
        return null;
      } else {
        methods = Array.from(metaMethods);
      }

      const paramExtractors: Array<ParamExtractor> = paramsMeta.map(meta => meta.f(container));
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
      ctrl = (context: Context) => {

        context.controllerName = controllerName;

        const oCtrl = component.get([context]);
        /**
         * paramsExtractors may be empty array. Must check first
         */
        if (paramExtractors.length > 0) {
          return Promise.all(paramExtractors.map(f => f(context)))
            .then(aParams => {
              debug('%s got params for controller %s params="%o"', TAG, controllerName, aParams);

              /**
               * @todo here we can join array of controller arguments with
               * controller argument names.
               */
              context.controllerArguments = aParams;

              return oCtrl[p](...aParams);
            });
        } else {
          debug('%s calling controller "%s" with NO params', TAG, controllerName);
          return oCtrl[p]();
        }
      };

      if (isDefined(controllerMiddleware)) {
        debug('%s adding controller middleware for controller="%s"', TAG, controllerName);
        middleware = controllerMiddleware(container);
        ctrlWithMiddleware = (context: Context) => {
          return middleware(context).then(ctrl);
        };
      }

      return {
        name: controllerName,
        requestMethods: methods,
        routePath: joinPath(basePath, metaPath),
        ctrl: ctrlWithMiddleware || ctrl,
      };

    }).filter(notEmpty);


  };

}
