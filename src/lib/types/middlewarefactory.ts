import { IfIocContainer } from 'bind';
import { MiddlewareFunc } from './middlewarefunc';

export type IMiddlewareFactory = (c: IfIocContainer) => MiddlewareFunc;
