import Context from '../../components/context';

export type MiddlewareFunc = (ctx: Context) => Promise<Context>
