export enum ErrorType {
  InputValidation = 3001,
  SchemaValidation,
  AppError,
  AppTimeout,
  AuthorizationError,
  HttpRequest,
}

export enum ErrorCategory {
  SystemError = 4001,
  AppError,
}
