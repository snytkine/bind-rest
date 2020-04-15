import { ClassPrototype } from 'bind-di';

export type IParamDecorator = (
  target: ClassPrototype,
  propertyKey: string,
  parameterIndex: number,
) => void;
