import HttpResponseCode from 'http-status-enum';
import { IAppResponse, IBindRestContext, isAppResponseWithBody } from '../../interfaces';
import { ErrorResponse } from '../appresponse';
import { HEADER_NAMES } from '../../consts';
import getByteLength from '../../utils/bytelength';

export default function getResponseFromContext(context: IBindRestContext): IAppResponse {
  const response = context.appResponse;
  let ret: IAppResponse;

  if (!response) {
    return new ErrorResponse(HttpResponseCode.INTERNAL_SERVER_ERROR, 'Response not processed');
  }

  /**
   * @todo if appResponse has cookies then convert cookies into set-cookie header
   * and add set-cookie to response.headers
   * The result cookie can be used by default response writer for node as well as
   * by Lambda (it is required by lambda to use set-cookie header instead of having cookies)
   * And after parsing cookies and setting set-cookie header the cookies property must be deleted from object
   * because otherwise it will break lambda response.
   */

  /**
   * IAppResponseWithBody are special. Convert to generic object that does not have extra properties
   * Also set content-length header
   */
  if (isAppResponseWithBody(response)) {
    response.headers[HEADER_NAMES.CONTENT_LENGTH] = `${getByteLength(response.body)}`;
    ret = {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
      getReadStream: response.getReadStream.bind(response),
    };
  } else {
    ret = response;
  }

  return ret;
}
