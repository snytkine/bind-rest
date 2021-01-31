import { Component, Maybe, Singleton } from 'bind-di';
import Cookies from 'cookies';
import { RESPONSE_COOKIES_WRITER } from '../lib/consts';
import Context from './context';
import { IResponseCookieWriter } from '../lib/interfaces/responsecookiewriter';

/**
 * @TODO in the future is should be possible for user to
 * provide their own implementation of library component
 * with the same component ID
 */
/*

@Component(RESPONSE_COOKIES_WRITER)
@Singleton
export default class ResponseCookies implements IResponseCookieWriter {
  // eslint-disable-next-line class-methods-use-this
  public sendCookies(ctx: Context): Maybe<Array<Error>> {
    const errors: Array<Error> = [];
    if (ctx.appResponse.cookies?.length > 0) {
      const CookiesLib = new Cookies(ctx.req, ctx.res);
      ctx.appResponse.cookies.forEach((cookie) => {
        try {
          CookiesLib.set(cookie.name, cookie.value, cookie.options);
        } catch (e) {
          errors.push(e);
        }
      });
    }

    if (errors.length > 0) {
      return errors;
    }

    return undefined;
  }
}
*/
