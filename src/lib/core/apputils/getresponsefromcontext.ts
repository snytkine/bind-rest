import HttpResponseCode from 'http-status-enum';
import { IAppResponse } from '../../interfaces';
import Context from '../../../components/context';
import { ErrorResponse } from '../appresponse';

export default function getResponseFromContext(context: Context): IAppResponse {
  const response = context.appResponse;

  return response || new ErrorResponse(HttpResponseCode.NO_CONTENT);
}
