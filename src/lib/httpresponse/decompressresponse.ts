import HttpResponse from "./httpresponse";
import decompressResponse from 'decompress-response';
import http from "http";

export default function decompressHttpResponse(response: HttpResponse): Promise<HttpResponse> {

  const im: http.IncomingMessage = response.getReadStream();

  const rs: http.IncomingMessage = decompressResponse(im);

  /**
   * Now the response should not have original content-encoding headers
   * because the stream is no longer compressed but original headers indicate
   * that it is compressed. This may cause problems either with browsers
   * or with another middleware that may see this as a compressed stream.
   */

  return Promise.resolve(new HttpResponse(rs, response.requestID));

}
