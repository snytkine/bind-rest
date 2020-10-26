import { IResponseCookie, IResponseCookieOptions } from '../../interfaces/responsecookie';

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
  return {
    name,
    value,
    options,
  };
};

export default ResponseCookie;
