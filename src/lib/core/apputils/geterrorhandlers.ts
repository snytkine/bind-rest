import { IfIocContainer, IfIocComponent, Maybe, isDefined } from 'bind-di';
import { AppErrorHandler, AppErrorHandlerFunc } from '../../interfaces/apperrorhandler';
import { IS_ERROR_HANDLER } from '../../decorators/metaprops';
import { IBindRestContext } from '../../interfaces/icontext';

const debug = require('debug')('bind:rest:init');

const TAG = 'GET_ERROR_HANDLERS';

export default function getErrorHandlers(ctr: IfIocContainer): Array<AppErrorHandlerFunc> {
  const ret: Maybe<Array<IfIocComponent<AppErrorHandler>>> = ctr.components.filter((c) => {
    return c.componentMetaData?.[IS_ERROR_HANDLER] !== undefined;
  });

  if (!isDefined(ret)) {
    debug('%s No AppErrorHandler components found in container', TAG);
    return [];
  }

  const aErrHandlers = ret.map((component) => (ctx: IBindRestContext) => {
    const errorHandler = component.get([ctx]);
    return errorHandler.handleError(ctx);
  });

  return aErrHandlers;
}
