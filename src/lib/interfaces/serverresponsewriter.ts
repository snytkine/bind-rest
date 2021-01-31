import * as Http from 'http';
import { IMaybeStringResponse } from './appresponse';

export type WriteServerResponseFunc = (
  appResponse: IMaybeStringResponse,
  res: Http.ServerResponse,
) => void;

export interface IResponseWriter {
  writeResponse: WriteServerResponseFunc;
}
