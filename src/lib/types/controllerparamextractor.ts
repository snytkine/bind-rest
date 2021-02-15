import { IfIocContainer } from 'bind-di';
import { IBindRestContext } from '../interfaces/icontext';

/**
 * FutureParam function can return value or Promise<value>
 * array of results of this function
 * will be used as input to Promise.all which can take
 * array of Promises or Iterable of values
 * all<TAll>(values: Iterable<TAll | PromiseLike<TAll>>): Promise<TAll[]>;
 */
export type FutureParam = (context: IBindRestContext) => any;
export type ParamExtractor = FutureParam;
export type ParamExtractorFactory = (container: IfIocContainer) => ParamExtractor;
