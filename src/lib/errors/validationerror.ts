import { ErrorCategory, ErrorType } from '../enums/errors';
import BindRestError from './bindrest';

export default class ValidationError extends BindRestError {
  constructor(message: string) {
    super(message, ErrorType.InputValidation, ErrorCategory.AppError);
  }
}
