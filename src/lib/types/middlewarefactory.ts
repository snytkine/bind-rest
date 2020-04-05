import { IfIocContainer } from 'bind';
import { MiddlewareFunc } from './middlewarefunc';
import { IMethodDecorator } from './methoddecorator';
import { ControllerFunc } from './controllers';

export type IMiddlewareFactory = (container: IfIocContainer) => MiddlewareFunc;
export type IMethodDecoratorFactory = (f: IMiddlewareFactory) => IMethodDecorator<ControllerFunc>;
