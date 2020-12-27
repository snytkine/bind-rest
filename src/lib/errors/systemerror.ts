import { ErrorType } from '../enums/errors';
import BindRestError from './bindrest';

export default class SystemError extends BindRestError {
  constructor(message: string, innerError?: Error) {
    super(message, ErrorType.SystemError, innerError);
  }
}
