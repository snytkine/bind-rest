import { JsonResponse } from '../core/appresponse';
import HttpStringResponse from './stringresponse';
import ApplicationError from '../errors/applicationerror';

export default function jsonParseBody(resp: HttpStringResponse): Promise<JsonResponse<{}>> {
  return new Promise((resolve, reject) => {
    const { body } = resp;
    const contentType = resp.headers['content-type'] || '';

    try {
      const json = JSON.parse(body);

      resolve(new JsonResponse(json, resp.statusCode, resp.headers));
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
