import HttpResponseCode from 'http-status-enum';
import stream from 'stream';
import { IAppResponse, IResponseHeaders } from '../../interfaces';
import getCharset from '../../utils/getcharset';
import ContentType from '../../consts/contenttypes';
import { IncomingHttpHeaders } from 'http';

export default class AppResponse implements IAppResponse<any> {

  protected charset;

  constructor(
    public readonly responseBody = '',
    public statusCode: number = HttpResponseCode.OK,
    private readonly hdrs: IncomingHttpHeaders,
  ) {
    this.charset = getCharset(hdrs);
  }

  get headers(): IResponseHeaders<any> {
    if (!this.hdrs['content-type']) {
      return { ...this.headers, ['content-type']: ContentType.PLAIN_TEXT };
    } else {
      return this.hdrs as IResponseHeaders<any>;
    }
  }

  getReadStream() {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(this.responseBody, this.charset);
    return bufferStream;
  }
}
