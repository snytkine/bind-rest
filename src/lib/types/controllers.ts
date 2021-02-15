import { IAppResponse } from '../interfaces/appresponse';
import { IBindRestContext } from '../interfaces/icontext';

export type ClassMethod = [{}, string];
/**
 * Params validator take array of parameters and validates each parameter
 * It should return either the original array or clone of original array but
 * it should NOT modify any values in the array
 *
 * @throws In case of validation error throws exception. Implementation may allow to either throw on first
 * validation error or throw with details about all validation errors
 */
export type ParamsValidator = (params: Array<any>) => Array<any>;
export type contextToParam = (ctx: IBindRestContext) => any;

// export type ControllerFunc = (...args: any[]) => IAppResponse | Promise<IAppResponse>;
export interface ControllerFunc {
  (...args: any[]): Promise<IAppResponse>;
}

export type IController = (ctx: IBindRestContext) => Promise<IAppResponse>;
