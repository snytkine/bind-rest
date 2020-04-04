import HTTP_STATUS_CODES from 'http-status-enum';
import HttpError from './http';

export default class NotFoundError extends HttpError {
  constructor(message: string) {
    super(HTTP_STATUS_CODES.NOT_FOUND, message);
  }
}
