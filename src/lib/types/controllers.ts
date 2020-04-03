import Context from '../../components/context';
import { IAppResponse } from '../interfaces';
export type ClassMethod = [{}, string];

/**
 * Params validator take array of parameters and validates each parameter
 * It should return either the original array or clone of original array but
 * it should NOT modify any values in the array
 *
 * @throws In case of validation error throws exception. Implementation may allow to either throw on first
 * validation error or throw with details about all validation errors
 */
export type ParamsValidator = (params: Array<any>)  => Array<any>
export type contextToParam = (ctx: Context) => any;
export type HandlerFunc = (ctx:Context) => Promise<Context>

export type ControllerFunc = (...args: any[]) => Promise<IAppResponse>
export type IController = (ctx: Context) => Promise<IAppResponse>
