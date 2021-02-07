import Context from '../../components/context';
import { IBindRestContext } from './icontext';

export interface IMiddleware {
  doFilter: (context: IBindRestContext) => Promise<IBindRestContext>;

  /**
   * Currently not used.
   * A middleware component may have onError function which will be used
   * as second function parameter passed to .then, allowing to recover from error thrown
   * in upstream middleware. This can also serve as error handler instead of default errorHandler
   * component
   *
   * a component of type ERROR_HANDLER will have same interface
   * but onError will be required
   * and doFilter may just return context unchanged.
   * @param error
   */
  onError?: (error: any) => Promise<Context>;
}
