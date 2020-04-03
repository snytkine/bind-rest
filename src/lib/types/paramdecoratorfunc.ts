import { ClassPrototype } from 'bind';

export type IParamDecorator = (target: ClassPrototype,
                              propertyKey: string,
                              parameterIndex: number) => void;
