/**
 * Created by snytkind on 11/26/16.
 */

export enum ErrorType {
  InputValidation = 3001,
  SchemaValidation,
  AppError,
  AppTimeout,
  AuthorizationError
}


export enum ErrorCategory {
  SystemError = 4001,
  AppError
}

export class FrameworkError extends Error {

  constructor(public message: string, public readonly type: ErrorType, public readonly category: ErrorCategory){
    super(message);
  }
}

export class AppError extends FrameworkError {

  constructor(message:string, type:ErrorType = ErrorType.AppError) {
    super(message, type, ErrorCategory.AppError);
  };
}


export class SystemError extends Error {

  readonly type: ErrorType;
  readonly category: ErrorCategory;

  constructor(message:string, type:ErrorType = ErrorType.AppError) {
    super(message);

    this.type = type;
    this.category = ErrorCategory.SystemError;
  };
}


export class TypeValidationError extends AppError {
  constructor(message:string){
    super(message, ErrorType.InputValidation)
  }
}
