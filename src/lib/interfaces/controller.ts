import HTTPMethod from 'http-method-enum';
import { IController } from '../types/controllers';
import { IControllerMatcher } from '../types/controllermatcher';

export interface IControllerDetails {
  name: string;
  requestMethods: Array<HTTPMethod>;
  routePath: string;
  ctrl: IController;
  matcher?: IControllerMatcher;
  priority?: number;
}
