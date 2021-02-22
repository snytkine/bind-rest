import {
  IfIocContainer,
  Maybe,
  isDefined,
  IfIocComponent,
  getComponentNameFromIdentity,
} from 'bind-di';
import { MiddlewareFunc } from '../../types/middlewarefunc';
import {
  MIDDLEWARE_PRIORITY,
  SYM_MIDDLEWARE_NAME,
  SYM_MIDDLEWARE_PRIORITY,
} from '../../decorators/metaprops';
import { IMiddleware } from '../../interfaces/middleware';
import ApplicationError from '../../errors/applicationerror';
import { IBindRestContext } from '../../interfaces';

const debug = require('debug')('bind:rest:runtime:middleware');

const TAG = 'MIDDLEWARE';

export default function getMiddlewares(ctr: IfIocContainer): Array<MiddlewareFunc> {
  const ret: Maybe<Array<IfIocComponent<IMiddleware>>> = ctr.components.filter((c) => {
    return c.componentMetaData?.[MIDDLEWARE_PRIORITY] !== undefined;
  });

  if (!isDefined(ret) || ret.length === 0) {
    throw new ApplicationError(`No Middleware components found in container.
    Container should have at least the RouterMiddleware which is part of this framework.
    Looks like RouterMiddleware was not loaded`);
  }

  ret.sort((a, b) => {
    return a.componentMetaData[MIDDLEWARE_PRIORITY] - b.componentMetaData[MIDDLEWARE_PRIORITY];
  });

  const aMW = ret.map((comp: IfIocComponent<IMiddleware>) => {
    const mwName = getComponentNameFromIdentity(comp.identity);
    const priority = comp.componentMetaData[MIDDLEWARE_PRIORITY];

    const func = (ctx: IBindRestContext) => {
      const mw = comp.get([ctx]);
      debug('%s applying middleware mw="%s" priority="%s"', TAG, mwName, priority);
      return mw.doFilter(ctx);
    };

    /**
     * Add Middleware name and priority to middleware function
     * as special Symbol properties of the function.
     */
    func[SYM_MIDDLEWARE_NAME] = mwName;
    func[SYM_MIDDLEWARE_PRIORITY] = priority;

    return func;
  });

  return aMW;
}
