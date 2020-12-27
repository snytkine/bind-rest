import BindRestError from '../bindrest';
import { ErrorType } from '../../enums';

export default class TypeValidationError extends BindRestError {
  constructor(message: string, innerError?: Error) {
    super(message, ErrorType.TypeValidation, innerError);
  }
}
