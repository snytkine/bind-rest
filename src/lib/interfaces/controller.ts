import HTTPMethod from 'http-method-enum';
import { IControllerMatcher,IController } from '../types';


export interface IControllerDetails {
  name: string,
  requestMethods: Array<HTTPMethod>,
  routePath: string,
  ctrl: IController
  matcher?: IControllerMatcher
  priority?: number
}
