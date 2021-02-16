import { IResponseCookie, IResponseCookieOptions } from '../interfaces/responsecookie';

/**
 * Helper factory function to create IResponseCookie object
 *
 * @param name
 * @param value
 * @param options
 *
 */
const ResponseCookie = (
  name: string,
  value: string = '',
  options?: IResponseCookieOptions,
): IResponseCookie => {
  /**
   * @todo validate name and value for disallowed chars?
   * There are also some rules specific to options
   * for example if cookie starts with __SECURE then it must have secure option
   * cookie with secure option cannot be sent to server over http but can then be sent
   * to client over http?
   */
  return {
    name,
    value,
    options,
  };
};

export default ResponseCookie;
