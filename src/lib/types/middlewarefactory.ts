import { IfIocContainer } from 'bind';
import { MiddlewareFunc } from './middlewarefunc';
import { ControllerFunc } from './controllers';
import { ClassOrMethodDecorator } from './classormethoddecorator';

export type IMiddlewareFactory = (container: IfIocContainer) => MiddlewareFunc;
export type IMethodDecoratorFactory = (
  f: IMiddlewareFactory,
) => ClassOrMethodDecorator<ControllerFunc>;
