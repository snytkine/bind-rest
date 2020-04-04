import { IfIocContainer, IfIocComponent, Maybe, isDefined } from 'bind';
import { AppErrorHandler, AppErrorHandlerFunc } from '../../interfaces';
import { IS_ERROR_HANDLER } from '../../decorators';
import Context from '../../../components/context';

const debug = require('debug')('promiseoft:init');

const TAG = 'GET_ERROR_HANDLERS';

export default function getErrorHandlers(ctr: IfIocContainer): Array<AppErrorHandlerFunc> {
  const ret: Maybe<Array<IfIocComponent<AppErrorHandler>>> = ctr.components.filter((c) => {
    return c.componentMetaData?.[IS_ERROR_HANDLER] !== undefined;
  });

  if (!isDefined(ret)) {
    debug('%s No AppErrorHandler components found in container', TAG);
    return [];
  }

  const aErrHandlers = ret.map((component) => (ctx: Context) => {
    const errorHandler = component.get([ctx]);
    return errorHandler.handleError(ctx);
  });

  return aErrHandlers;
}
