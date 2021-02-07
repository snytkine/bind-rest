import { IBindRestContext } from '../interfaces/icontext';

export type MiddlewareFunc = (ctx: IBindRestContext) => Promise<IBindRestContext>;
