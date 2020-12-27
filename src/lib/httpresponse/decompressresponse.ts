import decompressResponse from 'decompress-response';
import http from 'http';
import IncomingMessageResponse from './IncomingMessageResponse';
import HeaderNames from '../consts/headernames';
import { IHttpIncomingMessageResponse } from '../interfaces/httpclientreponse';

export default function decompressHttpResponse(
  response: IHttpIncomingMessageResponse,
): Promise<IHttpIncomingMessageResponse> {
  const im: http.IncomingMessage = response.getReadStream();
  const ORIGINAL_CONTENT_ENCODING = im.headers[HeaderNames.CONTENT_ENCODING];

  const rs: http.IncomingMessage = decompressResponse(im);

  /**
   * Must delete content-encoding header from original stream
   * If not deleted then result stream will still have
   * this header, indicating to any consumer that it's compressed
   * but in reality the stream is no longer compressed
   */
  if (['gzip', 'deflate', 'br'].includes(ORIGINAL_CONTENT_ENCODING)) {
    delete rs.headers[HeaderNames.CONTENT_ENCODING];
  }

  /**
   * Now the response should not have original content-encoding headers
   * because the stream is no longer compressed but original headers indicate
   * that it is compressed. This may cause problems either with browsers
   * or with another middleware that may see this as a compressed stream.
   */
  return Promise.resolve(new IncomingMessageResponse(rs, response.requestID));
}
