export enum ErrorType {
  InputValidation = 3001,
  TypeValidation,
  SystemError,
  SchemaValidation,
  AppError,
  AppTimeout,
  AuthenticationError,
  AuthorizationError,
  HttpRequestError,
  HttpResponseError,
}

export enum ErrorCategory {
  SystemError = 4001,
  ApplicationError,
}
