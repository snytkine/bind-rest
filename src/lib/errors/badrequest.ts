import HTTP_STATUS_CODES from 'http-status-enum';
import HttpError from './http';

export default class BadRequest extends HttpError {
  constructor(message: string) {
    super(HTTP_STATUS_CODES.BAD_REQUEST, message);
  }
}
