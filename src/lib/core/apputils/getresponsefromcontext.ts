import HttpResponseCode from 'http-status-enum';
import { IAppResponse, IAppResponseMaybeBody } from '../../interfaces';
import Context from '../../../components/context';
import { ErrorResponse } from '../appresponse';
import { CONTENT_TYPE, HEADER_NAMES } from '../../consts';
import getByteLength from '../../utils/bytelength';

export default function getResponseFromContext(context: Context): IAppResponse {
  const response = context.appResponse;
  let ret: IAppResponseMaybeBody;

  if (!response) {
    return new ErrorResponse(HttpResponseCode.NO_CONTENT, 'Response not processed');
  }

  /**
   * If response is JsonResponse then it will have .json prop
   */
  if (response.json) {
    Reflect.set(response.headers, HEADER_NAMES.CONTENT_TYPE, CONTENT_TYPE.APPLICATION_JSON);
  }

  /**
   * IStringResponse are special. Convert to generic object that does not have extra properties
   * Also set content-length header
   */

  const { body } = response;
  if (typeof body === 'string') {
    response.headers[HEADER_NAMES.CONTENT_LENGTH] = `${getByteLength(body)}`;
    ret = {
      statusCode: response.statusCode,
      headers: response.headers,
      body,
      getReadStream: response.getReadStream.bind(response),
    };
  } else {
    ret = response;
  }

  return ret;
}
