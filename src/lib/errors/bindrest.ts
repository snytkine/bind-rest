import { ErrorCategory, ErrorType } from '../enums/errors';

export default class BindRestError extends Error {
  constructor(
    public message: string,
    public readonly type: ErrorType,
    public readonly category: ErrorCategory,
    public readonly parentError?: Error,
  ) {
    super(message);
  }
}
