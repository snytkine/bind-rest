import { ClassPrototype } from 'bind-di';
import { ControllerFunc } from './controllers';

export type IMethodDecorator<T> = (
  target: ClassPrototype,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>,
) => void;

export type IControllerMethodDecorator = (
  target: ClassPrototype,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<ControllerFunc>,
) => void;
