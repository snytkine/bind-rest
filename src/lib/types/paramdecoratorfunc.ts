import { ClassPrototype } from 'bind';

export type paramdecorator = (target: ClassPrototype, propertyKey: string, parameterIndex: number) => void
