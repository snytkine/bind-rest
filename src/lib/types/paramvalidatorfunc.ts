import { IfIocContainer, Maybe } from 'bind';
import Context from '../../components/context';

export type AsyncParamValidator = (c: IfIocContainer) =>
  (ctx: Context) =>
    (param: any) =>
      Maybe<Error> | Promise<Maybe<Error>>

export type ParamValidator = (param: any) => Maybe<Error>
