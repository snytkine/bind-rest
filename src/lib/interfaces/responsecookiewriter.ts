import { Maybe } from 'bind-di';
import Context from '../../components/context';

export interface IResponseCookieWriter {
  sendCookies(ctx: Context): Maybe<Array<Error>>;
}
