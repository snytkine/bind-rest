import Context from '../../components/context';
import { IfIocContainer } from 'bind';

export type MiddlewareFunc = (ctx: Context) => Promise<Context>
export type MiddlewareFuncFactory = (container: IfIocContainer) => MiddlewareFunc
