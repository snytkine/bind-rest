import HTTP_STATUS_CODES from 'http-status-enum';
import HttpResponseError from './responseerror';

export default class NotFoundError extends HttpResponseError {
  constructor(message: string) {
    super(message, HTTP_STATUS_CODES.NOT_FOUND);
  }
}
