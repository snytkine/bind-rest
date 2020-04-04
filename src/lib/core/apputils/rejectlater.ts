import { SystemError, ErrorType } from '../apperrors';
import Context from '../../../components/context';
/**
 * Helper function that returns promise that rejects after number of milliseconds
 *
 * @param milliseconds:nuber time in milliseconds after which promise is rejected
 * @returns {Promise<number>} Promise is never resolved. It's rejected with Error
 */
export function rejectLater(milliseconds: number): Promise<Context> {
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
