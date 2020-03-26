import {IAppResponse} from "./appresponse";
import Context from '../../components/context';
export type ControllerFunc = (...args: any[]) => Promise<IAppResponse>
export type IController = (ctx: Context) => Promise<IAppResponse>
import HTTPMethod from 'http-method-enum';


export interface ControllerDetails {
  name:string,
  requestMethods:Array<HTTPMethod>,
  routePath:string,
  ctrl:IController
}
