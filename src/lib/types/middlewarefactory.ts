import { IfIocContainer, ClassOrMethodDecorator } from 'bind';
import { MiddlewareFunc } from './middlewarefunc';
import { ControllerFunc } from './controllers';

export type IMiddlewareFactory = (container: IfIocContainer) => MiddlewareFunc;
export type IMethodDecoratorFactory = (
  f: IMiddlewareFactory,
) => ClassOrMethodDecorator<ControllerFunc>;
