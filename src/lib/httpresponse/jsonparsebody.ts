import { JsonResponse } from '../core/appresponse';
import ApplicationError from '../errors/applicationerror';
import { IAppResponseWithBody } from '../interfaces';
import HEADER_NAMES from '../consts/headernames';

export default function jsonParseBody<T>(resp: IAppResponseWithBody): Promise<JsonResponse<T>> {
  return new Promise((resolve, reject) => {
    const { body } = resp;
    const contentType = resp.headers[HEADER_NAMES.CONTENT_TYPE] || '';

    try {
      const json = JSON.parse(body);

      resolve(new JsonResponse<T>(json, resp.statusCode, resp.headers));
    } catch (e) {
      reject(
        new ApplicationError(
          `Failed to parse response as JSON. error="${e.message}" 
          response contentType="${contentType}" body=${body}`,
        ),
      );
    }
  });
}
