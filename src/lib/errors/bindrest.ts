import { ErrorType } from '../enums/errors';
import ERROR_TYPE from '../consts/bindresterror';

export default class BindRestError extends Error {
  public readonly [ERROR_TYPE];

  constructor(public message: string, errorType: ErrorType, public readonly innerError?: Error) {
    super(message);
    this[ERROR_TYPE] = errorType;
  }
}
