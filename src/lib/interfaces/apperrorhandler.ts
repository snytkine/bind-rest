import { Maybe } from 'bind-di';
import { IBindRestContext } from './icontext';

/**
 * Error Handle Class must have handleError method which takes
 * context and returns function
 * That returned function must check that argument is an Error
 * it then must either handle that error somehow or return the error unmodified
 * If the error is handled then it must return undefined so that next error handler will skip it.
 *
 * handle error function should send out response to ctx.res but it should check
 * to make sure that response has not yet been sent.
 */
/**
 * @todo remove this, not used in new architecture
 */
export type AppErrorHandlerFunc = (ctx: IBindRestContext) => (e: Maybe<Error>) => Maybe<Error>;

export interface AppErrorHandler {
  handleError: AppErrorHandlerFunc;
}
