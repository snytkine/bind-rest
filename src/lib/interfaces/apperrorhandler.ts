import { Context } from '../core/context';

export const SYM_ERROR_HANDLER = Symbol.for("@ErrorHandler");
export type AppErrorHandlerFunc = (ctx: Context) => (e: any) => void;

export interface AppErrorHandler {
  handleError: AppErrorHandlerFunc
}
