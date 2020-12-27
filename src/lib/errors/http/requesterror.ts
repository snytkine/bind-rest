import BindRestError from '../bindrest';
import { IHttpRequestOptions } from '../../interfaces';
import { ErrorType } from '../../enums';

export default class HttpRequestError extends BindRestError {
  constructor(message: string, public readonly options: IHttpRequestOptions) {
    super(message, ErrorType.HttpRequestError);
  }
}
