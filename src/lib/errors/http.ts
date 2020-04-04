import HTTP_STATUS_CODES from 'http-status-enum';

export default class HttpError extends Error {
  constructor(public statusCode: HTTP_STATUS_CODES, message: string) {
    super(message);
  }
}
