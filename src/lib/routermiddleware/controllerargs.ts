import "reflect-metadata";
import {MiddlewareFunc} from "../interfaces/middleware";
import {IContext} from "../interfaces/context";
import {contextToParam} from "../types/controllers";
const debug = require('debug')('promiseoft:middleware');
const TAG = "CONTROLLER-ARGUMENTS-FACTORY";
export function controllerArgumentsFactory(paramsMap: Array<contextToParam>): MiddlewareFunc {

  return function argumentsFactory(ctx: IContext): Promise<IContext> {
    debug('%s arguments to be generated', TAG);
    ctx.controllerArguments = paramsMap.map(f => f(ctx));
    debug('%s args generated', TAG);
    debug('%s created Arguments: %j', TAG, ctx.controllerArguments);
    return Promise.resolve(ctx);
  }
}

