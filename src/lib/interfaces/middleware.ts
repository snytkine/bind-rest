import Context from '../../components/context';

export interface IMiddleware {
  doFilter: (context: Context) => Promise<Context>
}



