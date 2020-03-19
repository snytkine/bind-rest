import { Context } from '../core/context';

export type MiddlewareFunc = (ctx: Context) => Promise<Context>

export interface IMiddleware {
  doFilter: () => boolean
}



