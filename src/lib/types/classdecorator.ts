import { Constructor } from 'bind-di';

export type IClassDecorator<T> = (clazz: Constructor<T>) => void;
