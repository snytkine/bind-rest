import * as Http from 'http';
import { IAppResponseMaybeBody } from './appresponse';

export type WriteServerResponseFunc = (
  appResponse: IAppResponseMaybeBody,
  res: Http.ServerResponse,
) => void;

export interface IResponseWriter {
  writeResponse: WriteServerResponseFunc;
}
