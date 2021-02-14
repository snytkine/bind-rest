import * as Http from 'http';
import { IAppResponse } from './appresponse';

export type WriteServerResponseFunc = (appResponse: IAppResponse, res: Http.ServerResponse) => void;

export interface IResponseWriter {
  writeResponse: WriteServerResponseFunc;
}
