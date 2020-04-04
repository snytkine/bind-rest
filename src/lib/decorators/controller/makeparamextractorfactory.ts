import { IfIocContainer } from 'bind';
import ControllerParamType from '../../enums/controllerparamtype';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import Context from '../../../components/context';
import SystemError from '../../errors/systemerror';

const debug = require('debug')('promiseoft:decorators');

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
      ret = (c: IfIocContainer) => (ctx: Context) => {
        return ctx.parsedCookies[paramName];
      };
      break;

    case ControllerParamType.ContextParam:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: Context) => {
        return ctx.storage[paramName];
      };
      break;

    case ControllerParamType.QueryParam:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: Context) => {
        return ctx.parsedUrlQuery[paramName];
      };
      break;

    case ControllerParamType.Header:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: Context) => {
        return ctx.req.headers[paramName];
      };
      break;

    case ControllerParamType.PathParam:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ret = (c: IfIocContainer) => (ctx: Context) => {
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
