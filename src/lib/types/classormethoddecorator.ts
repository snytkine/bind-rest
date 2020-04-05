import { ClassPrototype, Constructor } from 'bind';

export type ClassOrMethodDecorator<T> = (
  target: ClassPrototype | Constructor<any>,
  propertyKey?: string,
  descriptor?: TypedPropertyDescriptor<T>,
) => void;
