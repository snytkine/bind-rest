import { IfIocContainer } from 'bind';
import { MiddlewareFunc } from './middlewarefunc';
import { IMethodDecorator } from './methoddecorator';

export type IMiddlewareFactory = (container: IfIocContainer) => MiddlewareFunc;
export type IMethodDecoratorFactory = (f: IMiddlewareFactory) => IMethodDecorator;
