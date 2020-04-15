import { ClassPrototype } from 'bind-di';

export type IMethodDecorator<T> = (
  target: ClassPrototype,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>,
) => void;
