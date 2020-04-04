import HttpResponseCode from 'http-status-enum';
import { ResponseHeaders } from '../../types';
import AppResponse from './appresponse';

export default class JsonResponse extends AppResponse {
  constructor(
    private readonly resonseJson: {},
    statusCode = HttpResponseCode.OK,
    readonly headers: ResponseHeaders = { 'content-type': 'application/json' },
  ) {
    super(JSON.stringify(resonseJson), statusCode, headers);
  }

  get json() {
    return this.resonseJson;
  }
}
