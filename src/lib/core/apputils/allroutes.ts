import { IControllerDetails } from '../../interfaces';

const SYM_ALL_ROUTES = Symbol.for('@ALL_ROUTES');
const debug = require('debug')('promiseoft:runtime:application');

/**
 * @todo remove this, not used in new version
 */
class AllRoutes {
  private aControllerDetails_: Array<IControllerDetails>;

  set allControllers(aControllerDetails: Array<IControllerDetails>) {
    this.aControllerDetails_ = aControllerDetails;
    debug('AllRoutes::set allControllers', aControllerDetails);
  }

  get allControllers(): Array<IControllerDetails> {
    const ret = this.aControllerDetails_;
    debug('AllRoutes::get allControllers', ret);

    return ret;
  }
}

export { AllRoutes, SYM_ALL_ROUTES };
