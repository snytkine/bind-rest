import HttpResponseCode from 'http-status-enum';
import AppResponse from './appresponse';

export default class RedirectResponse extends AppResponse {
  constructor(
    public readonly redirectUrl: string,
    responseCode: number = HttpResponseCode.MOVED_PERMANENTLY,
  ) {
    super('', responseCode, { Location: redirectUrl, 'content-type': 'text/plain' });
  }
}
