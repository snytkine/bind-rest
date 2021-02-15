import * as Http from 'http';
import { IServerResponse } from './appresponse';

export type WriteServerResponseFunc = (
  serverResponse: IServerResponse,
  res: Http.ServerResponse,
) => void;

export interface IResponseWriter {
  writeResponse: WriteServerResponseFunc;
}
