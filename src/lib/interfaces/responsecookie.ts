export interface IResponseCookieOptions {
  /**
   * a number representing the milliseconds from Date.now() for expiry
   */
  maxAge?: number;
  /**
   * a Date object indicating the cookie's expiration
   * date (expires at the end of session by default).
   */
  expires?: Date;
  /**
   * a string indicating the path of the cookie (/ by default).
   */
  path?: string;
  /**
   * a string indicating the domain of the cookie (no default).
   */
  domain?: string;
  /**
   * a boolean indicating whether the cookie is only to be sent
   * over HTTPS (false by default for HTTP, true by default for HTTPS).
   */
  secure?: boolean;

  /**
   * a boolean indicating whether the cookie is only to be sent over HTTP(S),
   * and not made available to client JavaScript (true by default).
   */
  httpOnly?: boolean;
  /**
   * a boolean indicating whether the cookie is to be signed (false by default).
   * If this is true, another cookie of the same name with the .sig suffix
   * appended will also be sent, with a 27-byte url-safe base64 SHA1 value
   * representing the hash of cookie-name=cookie-value against the first Keygrip key.
   * This signature key is used to detect tampering the next time a cookie is received.
   */
  signed?: boolean;
  /**
   * a boolean indicating whether to overwrite previously set
   * cookies of the same name (false by default). If this is true,
   * all cookies set during the same request with the same
   * name (regardless of path or domain) are filtered out of
   * the Set-Cookie header when setting this cookie.
   */
  overwrite?: boolean;
}

export interface IResponseCookieValue {
  /**
   * If value is not supplied or an empty string, cookie will be send with expires value
   * in the past. This is a way to delete a cookie.
   */
  value: string;
  options?: IResponseCookieOptions;
}

export interface IResponseCookie extends IResponseCookieValue {
  name: string;
}
