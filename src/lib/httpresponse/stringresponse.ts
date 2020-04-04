import { AppResponse } from '../core/appresponse';
import { IAppResponse } from '../interfaces';

export default class HttpStringResponse extends AppResponse implements IAppResponse {
  constructor(
    b: string = '',
    public statusCode: number,
    readonly headers: { [key: string]: string },
  ) {
    super(b, statusCode, headers);
  }

  get body(): string {
    return this.responseBody;
  }
}
