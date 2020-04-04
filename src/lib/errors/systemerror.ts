import { ErrorCategory, ErrorType } from '../enums/errors';

export default class SystemError extends Error {
  readonly type: ErrorType;

  readonly category: ErrorCategory;

  constructor(message: string, type: ErrorType = ErrorType.AppError) {
    super(message);

    this.type = type;
    this.category = ErrorCategory.SystemError;
  }
}
