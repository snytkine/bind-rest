import { Maybe } from 'bind-di';
import { IBindRestContext } from './icontext';

export interface IResponseCookieWriter {
  sendCookies(ctx: IBindRestContext): Maybe<Array<Error>>;
}
