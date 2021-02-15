import HttpResponseCode from 'http-status-enum';
import AppResponse from './appresponse';
import { HEADER_NAMES } from '../../consts';

export default class RedirectResponse extends AppResponse {
  constructor(
    public readonly redirectUrl: string,
    responseCode: number = HttpResponseCode.MOVED_PERMANENTLY,
  ) {
    super('', responseCode, { [HEADER_NAMES.REDIRECT]: redirectUrl });
  }
}
