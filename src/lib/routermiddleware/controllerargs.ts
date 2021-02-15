import 'reflect-metadata';
import { MiddlewareFunc } from '../types';
import { contextToParam } from '../types/controllers';
import { IBindRestContext } from '../interfaces/icontext';

const debug = require('debug')('bind:rest:middleware');

const TAG = 'CONTROLLER-ARGUMENTS-FACTORY';

/**
 * @todo delete if not used.
 * @param paramsMap
 */
export default function controllerArgumentsFactory(
  paramsMap: Array<contextToParam>,
): MiddlewareFunc {
  return function argumentsFactory(ctx: IBindRestContext): Promise<IBindRestContext> {
    debug('%s arguments to be generated', TAG);
    ctx.controllerArguments = paramsMap.map((f) => f(ctx));
    debug('%s args generated', TAG);
    debug('%s created Arguments: %j', TAG, ctx.controllerArguments);
    return Promise.resolve(ctx);
  };
}
