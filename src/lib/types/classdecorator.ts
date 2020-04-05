import { Constructor } from 'bind';

export type IClassDecorator<T> = (clazz: Constructor<T>) => void;
