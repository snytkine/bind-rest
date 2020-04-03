import {ClassPrototype} from 'bind'
import { ControllerFunc } from './controllers';

export type IMethodDecorator = (target: ClassPrototype,
                              propertyKey: string,
                              descriptor: TypedPropertyDescriptor<ControllerFunc>) => void;
