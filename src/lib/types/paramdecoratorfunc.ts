import { Target } from 'bind';

export type paramdecorator = (target: Target, propertyKey: string, parameterIndex: number) => void
