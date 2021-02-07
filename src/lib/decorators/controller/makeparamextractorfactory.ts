import { IfIocContainer } from 'bind-di';
import ControllerParamType from '../../enums/controllerparamtype';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import SystemError from '../../errors/systemerror';
import { IBindRestContext } from '../../interfaces/icontext';

const debug = require('debug')('bind:rest:decorators');

const TAG = 'MAKE-PARAMS-EXTRACTOR';

function makeParamExtractorFactory(
  t: ControllerParamType,
  paramName: string,
): ParamExtractorFactory {
  debug(
    '%s Entered makeParamExtractorFactory with t="%s", paramName="%s"',
    TAG,
    ControllerParamType[t],
    paramName,
  );

  let ret: ParamExtractorFactory;

  switch (t) {
    case ControllerParamType.Cookie:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: IBindRestContext) => {
        return ctx.parsedCookies[paramName];
      };
      break;

    case ControllerParamType.ContextParam:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: IBindRestContext) => {
        return ctx.storage[paramName];
      };
      break;

    case ControllerParamType.QueryParam:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: IBindRestContext) => {
        return ctx.parsedUrlQuery[paramName];
      };
      break;

    case ControllerParamType.Header:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: IBindRestContext) => {
        return ctx.requestHeaders[paramName];
      };
      break;

    case ControllerParamType.PathParam:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: IBindRestContext) => {
        const pathParam = ctx.routeParams?.pathParams?.find((p) => p.paramName === paramName);

        return pathParam?.paramValue;
      };
      break;

    default:
      throw new SystemError(`Unsupported ControllerParamType type ${ControllerParamType[t]}`);
  }

  return ret;
}

export default makeParamExtractorFactory;
