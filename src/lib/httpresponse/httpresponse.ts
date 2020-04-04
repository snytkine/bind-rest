import { IAppResponse } from '../interfaces';

export default class HttpResponse implements IAppResponse {
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
