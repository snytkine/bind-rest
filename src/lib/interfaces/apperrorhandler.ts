import Context from '../../components/context';
import {Maybe} from 'bind';

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
export type AppErrorHandlerFunc = (ctx: Context) => (e: Maybe<Error>) => Maybe<Error>;

export interface AppErrorHandler {
  handleError: AppErrorHandlerFunc
}
