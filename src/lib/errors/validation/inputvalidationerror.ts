import { ErrorType } from '../../enums/errors';
import BindRestError from '../bindrest';

export default class InputValidationError extends BindRestError {
  constructor(message: string, innerError?: Error) {
    super(message, ErrorType.InputValidation, innerError);
  }
}
