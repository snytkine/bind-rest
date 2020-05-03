/**
 * Common values for content-type headers
 * a large list is here http://www.iana.org/assignments/media-types/media-types.xhtml
 * Common types : https://stackoverflow.com/questions/23714383/what-are-all-the-possible-values-for-http-content-type-header
 */
enum ContentType {
  PLAIN_TEXT = 'text/plain',
  JSON = 'application/json; charset=utf-8',
  JAVASCRIPT = 'application/javascript',
  HTML = 'text/html',
  XHTML = 'application/xhtml+xml',
  XML = 'text/xml; charset=utf-8',
  OCTET_STREAM = 'application/octet-stream',
  FORM_URLENCODED = 'application/x-www-form-urlencoded'

}

export default ContentType;
