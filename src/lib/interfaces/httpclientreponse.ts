import {IAppResponse} from "./appresponse";

export interface IHttpClientResponse extends IAppResponse {
  requetId?: string;
}
