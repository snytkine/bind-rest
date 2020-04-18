import SystemError from '../../errors/systemerror';
import { ErrorType } from '../../enums/errors';
/**
 * Helper function that returns promise that rejects after number of milliseconds
 *
 * @param milliseconds:nuber time in milliseconds after which promise is rejected
 * @returns {Promise<never>} Promise is never resolved. It's rejected with SystemError
 */
export default function rejectLater(milliseconds: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(
      () =>
        reject(
          new SystemError(
            `Response timed out after ${milliseconds} milliseconds`,
            ErrorType.AppTimeout,
          ),
        ),
      milliseconds,
    );
  });
}
