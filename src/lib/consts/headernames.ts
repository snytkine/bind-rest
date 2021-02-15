/**
 * @todo update with all known headers from
 * IncomingMessage.headers
 * or look in http2.constants
 */
enum MyHeaderNames {
  AUTHORIZATION = 'authorization',
  CONTENT_ENCODING = 'content-encoding',
  CONTENT_TYPE = 'content-type',
  CONTENT_LENGTH = 'content-length',
  SET_COOKIE = 'set-cookie',
  REDIRECT = 'redirect',
}

export default MyHeaderNames;
