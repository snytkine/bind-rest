import { IBindRestContext } from '../interfaces/icontext';

export type IControllerMatcher = (ctx: IBindRestContext) => boolean;
