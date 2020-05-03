import HttpResponseCode from 'http-status-enum';
import { IAppResponse, IResponseHeaders } from '../../interfaces';
import ContentType from '../../consts/contenttypes';
import { IncomingHttpHeaders } from 'http';
import stream from 'stream';

export default class JsonResponse<T extends {} = {}> implements IAppResponse<ContentType.JSON> {

  private s: string;
  private len: string;

  constructor(
    private readonly resonseObj: T,
    public readonly statusCode = HttpResponseCode.OK,
    private hdrs: IncomingHttpHeaders,
  ) {
  }


  private getContentLength() {
    if (this.len===undefined) {
      this.len = String(Buffer.byteLength(this.body, 'utf8'));
    }

    return this.len;
  }


  get headers(): IResponseHeaders<ContentType.JSON> {

    return {
      ...this.hdrs,
      ['content-type']: ContentType.JSON,
      ['content-length']: this.getContentLength(),
    };
  }

  get body(): string {
    if (!this.s) {
      this.s = JSON.stringify(this.resonseObj);
    }

    return this.s;
  }

  get json() {
    return this.resonseObj;
  }

  getReadStream() {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(this.body, 'utf8');
    return bufferStream;
  }
}
