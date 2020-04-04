import { ErrorCategory, ErrorType } from '../enums/errors';
import BindRestError from './bindrest';

export default class ApplicationError extends BindRestError {
  constructor(message: string, error?: Error) {
    super(message, ErrorType.AppError, ErrorCategory.AppError, error);
  }
}
