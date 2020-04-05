import { ClassPrototype } from 'bind';

export type IMethodDecorator<T> = (
  target: ClassPrototype,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>,
) => void;
