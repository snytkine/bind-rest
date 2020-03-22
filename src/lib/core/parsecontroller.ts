import {
  IfIocComponent,
  IfIocContainer,
  stringifyIdentity,
  Maybe,
  isDefined,
  getOrElse,
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
import { Context } from './context';

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
      ctrl = (context: Context) => {

        const oCtrl = component.get([context]);
        return Promise.all(paramExtractors.map(f => f(context)))
          .then(aParams => {
            debug('%s got params for controller %s params="%o"', TAG, controllerName, aParams);
            context.controllerName = controllerName;
            context.controllerArguments = aParams;

            return oCtrl[p](...aParams);
          });
      };

      if (isDefined(controllerMiddleware)) {
        middleware = controllerMiddleware(container);
        ctrl = (context: Context) => {
          return middleware(context).then(ctrl);
        };
      }

      return {
        name: controllerName,
        requestMethods: methods,
        routePath: joinPath(basePath, metaPath),
        ctrl: ctrl,
      };

    }).filter(notEmpty);


  };

}
