import HTTP_STATUS_CODES from 'http-status-enum';

export class HttpError extends Error {

  constructor(public statusCode: HTTP_STATUS_CODES, message: string) {
    super(message);
  }

}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(HTTP_STATUS_CODES.NOT_FOUND, message);
  }
}

export class BadRequest extends HttpError {
  constructor(message: string) {
    super(HTTP_STATUS_CODES.BAD_REQUEST, message);
  }
}
