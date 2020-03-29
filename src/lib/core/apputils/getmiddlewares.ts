import { MiddlewareFunc } from '../../types';
import { MIDDLEWARE_PRIORITY, SYM_MIDDLEWARE_NAME, SYM_MIDDLEWARE_PRIORITY } from '../../decorators';
import { IMiddleware } from '../../interfaces';
import Context from '../../../components/context';
import { ApplicationError } from '../apperrors';
import {
  IfIocContainer,
  Maybe,
  isDefined,
  IfIocComponent,
  getComponentNameFromIdentity,
} from 'bind';
const debug = require('debug')('promiseoft:runtime:middleware');
const TAG = 'MIDDLEWARE';

export default function getMiddlewares(ctr: IfIocContainer): Array<MiddlewareFunc> {

  let ret: Maybe<Array<IfIocComponent<IMiddleware>>> = ctr.components.filter(c => {
    return c.componentMetaData?.[MIDDLEWARE_PRIORITY]!==undefined;
  });

  if (!isDefined(ret)) {
    throw new ApplicationError(`No Middleware components found in container.
    Container should have at least the RouterMiddleware which is part of this framework.
    Looks like RouterMiddleware was not loaded`);
  }

  ret.sort((a, b) => {
    return a.componentMetaData[MIDDLEWARE_PRIORITY] - b.componentMetaData[MIDDLEWARE_PRIORITY];
  });

  /**
   * @todo remove this
   */
  const aMW_ = ret.map((comp: IfIocComponent<IMiddleware>) => (ctx: Context) => {

      const mw = comp.get([ctx]);
      /**
       * Add Middleware name and priority to middleware function
       * as special Symbol properties of the function.
       */
      mw[SYM_MIDDLEWARE_NAME] = getComponentNameFromIdentity(comp.identity);
      mw[SYM_MIDDLEWARE_PRIORITY] = comp.componentMetaData[MIDDLEWARE_PRIORITY];

      return mw.doFilter(ctx);
    },
  );

  const aMW = ret.map((comp: IfIocComponent<IMiddleware>) => {

    const mwName = getComponentNameFromIdentity(comp.identity);
    const priority = comp.componentMetaData[MIDDLEWARE_PRIORITY];

    const func = (ctx: Context) => {

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
