import { MiddlewareFunc } from '../../types';
import { IfIocContainer, Maybe, IfIocComponent } from 'bind';
import { MIDDLEWARE_PRIORITY } from '../../decorators';
import { IMiddleware } from '../../interfaces';
import Context from '../../../components/context';
import { ApplicationError } from '../apperrors';

export default function getMiddlewares(ctr: IfIocContainer): Array<MiddlewareFunc> {

  let ret: Maybe<Array<IfIocComponent<IMiddleware>>> = ctr.components.filter(c => {
    return c.componentMetaData?.[MIDDLEWARE_PRIORITY]!==undefined;
  });

  if (!ret) {
    throw new ApplicationError(`No Middleware components found in container.
    Container should have at least the RouterMiddleware which is part of this framework.
    Looks like RouterMiddleware was not loaded`);
  }

  ret.sort((a, b) => {
    return a.componentMetaData[MIDDLEWARE_PRIORITY] - b.componentMetaData[MIDDLEWARE_PRIORITY];
  });


  const aMW = ret.map((comp: IfIocComponent<IMiddleware>) => (ctx: Context) => {
    const mw = comp.get([ctx]);
    return mw.doFilter(ctx);
  });

  return aMW;
}
