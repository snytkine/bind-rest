import {MiddlewareFunc} from "./middleware";

export interface IControllerMiddleware {
  doFilter: MiddlewareFunc
}