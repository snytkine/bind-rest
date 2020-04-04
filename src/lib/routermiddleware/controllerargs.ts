import 'reflect-metadata';
import { MiddlewareFunc } from '../types';
import { contextToParam } from '../types/controllers';
import Context from '../../components/context';

const debug = require('debug')('promiseoft:middleware');

const TAG = 'CONTROLLER-ARGUMENTS-FACTORY';

/**
 * @todo delete if not used.
 * @param paramsMap
 */
export default function controllerArgumentsFactory(
  paramsMap: Array<contextToParam>,
): MiddlewareFunc {
  return function argumentsFactory(ctx: Context): Promise<Context> {
    debug('%s arguments to be generated', TAG);
    ctx.controllerArguments = paramsMap.map((f) => f(ctx));
    debug('%s args generated', TAG);
    debug('%s created Arguments: %j', TAG, ctx.controllerArguments);
    return Promise.resolve(ctx);
  };
}
