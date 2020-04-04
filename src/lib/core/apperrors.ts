/**
 * Created by snytkind on 11/26/16.
 */

export enum ErrorType {
  InputValidation = 3001,
  SchemaValidation,
  AppError,
  AppTimeout,
  AuthorizationError,
}

export enum ErrorCategory {
  SystemError = 4001,
  AppError,
}

export class BindRestError extends Error {
  constructor(
    public message: string,
    public readonly type: ErrorType,
    public readonly category: ErrorCategory,
    public readonly parentError?: Error,
  ) {
    super(message);
  }
}

export class ApplicationError extends BindRestError {
  constructor(message: string, error?: Error) {
    super(message, ErrorType.AppError, ErrorCategory.AppError, error);
  }
}

export class SystemError extends Error {
  readonly type: ErrorType;

  readonly category: ErrorCategory;

  constructor(message: string, type: ErrorType = ErrorType.AppError) {
    super(message);

    this.type = type;
    this.category = ErrorCategory.SystemError;
  }
}

export class ValidationError extends BindRestError {
  constructor(message: string) {
    super(message, ErrorType.InputValidation, ErrorCategory.AppError);
  }
}

export class TypeValidationError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}
