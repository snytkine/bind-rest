import Context from '../core/context';

export interface IMiddleware {
  doFilter: (context: Context) => Promise<Context>
}



