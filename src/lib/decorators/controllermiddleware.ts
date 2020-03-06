import {IControllerMiddleware, Newable} from "../interfaces";
//import {SYM_COMPONENT_TYPE, SYM_COMPONENT_NAME} from "./metaprops";
import {ComponentType} from "../enums/componenttype";
const debug = require('debug')('promiseoft:decorators');

const TAG = "@ControllerMiddleware";

export function ControllerMiddleware(name: string){

  return function (target: Newable<IControllerMiddleware>, propertyKey?: string) {

    debug(`Defining ${TAG} ${name} for class ${target.name}`);
    //let type = Reflect.getMetadata(SYM_COMPONENT_TYPE, target);
    //if (type) {
    //  throw new SyntaxError(`Cannot add ${TAG} annotation to Class '${target.name}' because it is already annotated as '${ComponentType[type]}'`)
    //}

    //Reflect.defineMetadata(SYM_COMPONENT_TYPE, ComponentType.CONTROLLER_MIDDLEWARE, target);
    //Reflect.defineMetadata(SYM_COMPONENT_NAME, name, target);

  }
}
