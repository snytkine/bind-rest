import Context from '../core/context';

export type AppErrorHandlerFunc = (ctx: Context) => (e: any) => void;

export interface AppErrorHandler {
  handleError: AppErrorHandlerFunc
}
