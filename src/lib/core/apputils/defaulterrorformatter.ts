import { FormatErrorFunc } from '../../interfaces/errorformater';
import { ErrorResponse } from '../appresponse';

/**
 * @todo detect errors of type BindRestError, return JsonResponse, add category and code to error,
 * add stacktrace to error, in case of inner error add inner error message and stacktrace
 * @param error
 */
const formatError: FormatErrorFunc = (error: any) => {
  if (!error) {
    return new ErrorResponse(500);
  }

  if (error && typeof error.statusCode === 'number' && typeof error.body === 'string') {
    return error;
  }

  if (typeof error === 'string') {
    return new ErrorResponse(400, error);
  }

  if (error instanceof Error) {
    return new ErrorResponse(400, error.message);
  }

  return new ErrorResponse(500);
};

export default formatError;
