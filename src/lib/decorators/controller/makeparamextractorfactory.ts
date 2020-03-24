import { PathDetailsType } from '../../enums';
import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import { IfIocContainer } from 'bind';
import Context from '../../core/context';
import { SystemError } from '../../core';

const debug = require('debug')('promiseoft:decorators');
const TAG = 'MAKE-PARAMS-EXTRACTOR';

function makeParamExtractorFactory(t: PathDetailsType, paramName: string): ParamExtractorFactory {
  debug('%s Entered makeParamExtractorFactory with t="%s", paramName="%s"',
    TAG,
    PathDetailsType[t],
    paramName);

  let ret: ParamExtractorFactory;

  switch (t) {
    case PathDetailsType.QueryParam:
      ret = (c: IfIocContainer) => (ctx: Context) => {
        return Promise.resolve(ctx.parsedUrlQuery[paramName]);
      };
      break;

    case PathDetailsType.HeaderParam:
      ret = (c: IfIocContainer) => (ctx: Context) => {
        return Promise.resolve(ctx.req.headers[paramName]);
      };
      break;

    default:
      throw new SystemError(`Unsupported PathDetailsType type ${PathDetailsType[t]}`);
  }

  return ret;
}

export default makeParamExtractorFactory;
