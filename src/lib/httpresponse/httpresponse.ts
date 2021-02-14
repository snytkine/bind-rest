import { IHttpClientResponse } from '../interfaces/httpclientreponse';

export default class HttpResponse implements IHttpClientResponse {
  constructor(
    public statusCode: number,
    public headers: { [key: string]: any },
    private rs: NodeJS.ReadableStream,
    public readonly requestID: string = '-',
  ) {}

  public getReadStream() {
    return this.rs;
  }
}
