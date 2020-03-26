import { AppErrorHandler, AppErrorHandlerFunc } from '../../interfaces';
import { IS_ERROR_HANDLER } from '../../decorators';
import { ApplicationError } from '../apperrors';
import Context from '../../../components/context';
import {
  IfIocContainer,
  IfIocComponent,
  Maybe,
  isDefined,
} from 'bind';


const debug = require('debug')('promiseoft:init');
const TAG = 'GET_ERROR_HANDLERS';

export default function getErrorHandlers(ctr: IfIocContainer): Array<AppErrorHandlerFunc> {
  let ret: Maybe<Array<IfIocComponent<AppErrorHandler>>> = ctr.components.filter(c => {
    return c.componentMetaData?.[IS_ERROR_HANDLER]!==undefined;
  });

  if (!isDefined(ret)) {
    debug('No AppErrorHandler components found in container');
    return [];
  }

  const aErrHandlers = ret.map(component => (ctx: Context) => {
      const errorHandler = component.get([ctx]);
      return errorHandler.handleError(ctx);
    },
  );

  return aErrHandlers;
}
