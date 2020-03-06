import {IAppResponse} from "./appresponse";
import {RequestMethod} from "../enums/requestmethods";
import {IContext} from "./context";
export type ControllerFunc = (...args: any[]) => Promise<IAppResponse>
export type IController = (ctx: IContext) => Promise<IAppResponse>


export interface ControllerDetails {
  name:string,
  requestMethods:Array<RequestMethod>,
  routePath:string,
  ctrl:IController
}
