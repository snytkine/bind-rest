import BindRestError from '../bindrest';
import { ErrorType } from '../../enums';

export default class SchemaValidationError extends BindRestError {
  constructor(message: string, innerError?: Error) {
    super(message, ErrorType.SchemaValidation, innerError);
  }
}
