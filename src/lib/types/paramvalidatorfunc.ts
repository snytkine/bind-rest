import { IfIocContainer, Maybe } from 'bind';
import Context from '../../components/context';

export type IntoPromise<T> = (val: T) => Promise<T>;
export type AsyncParamValidator = (param: any) => Maybe<Error> | Promise<Maybe<Error>>;
export type AsyncContextParamValidator = (ctx: Context) => AsyncParamValidator;

/**
 * AsyncParamValidator has access to container and Context
 * and also can do async operations and return Promise<Error | undefined>
 *   or it can do a synchronous operation and return Error | undefined
 *
 * AsyncParamValidator can get dependencies from container, for example
 * it can get database component, lookup some data in database
 * and then return Promise<Error> if based on database lookup validation fails.
 *
 * Just like normal ParamValidator AsyncParamValidator cannot modify
 * the value of param.
 */
export type AsyncValidator = (c: IfIocContainer) => AsyncContextParamValidator;

/**
 * Validator function cannot modify the param
 * Instead of throwing the Error it must return
 * Error in case of validation error
 * or undefined if validation is successful
 */
export type ParamValidator = (param: any) => Maybe<Error>;
