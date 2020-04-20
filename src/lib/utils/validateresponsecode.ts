import HttpResponse from '../httpresponse/httpresponse';
import { ApplicationError } from '../errors';

const validateResponseCode = (isValid: (number) => boolean) => (
  resp: HttpResponse,
): Promise<HttpResponse> => {
  if (isValid(resp.statusCode)) {
    return Promise.resolve(resp);
  }

  return Promise.reject(
    new ApplicationError(`Validate Response Code Error. statusCode=${resp.statusCode}`),
  );
};

export default validateResponseCode;
