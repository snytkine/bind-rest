import {
  ControllerDetails,
} from '../../interfaces'

const SYM_ALL_ROUTES = Symbol.for('@ALL_ROUTES');
const debug = require('debug')('promiseoft:runtime:application');

class AllRoutes {

  private aControllerDetails_: Array<ControllerDetails>;

  set allControllers(aControllerDetails: Array<ControllerDetails>) {
    this.aControllerDetails_ = aControllerDetails;
    debug('AllRoutes::set allControllers', aControllerDetails);
  }

  get allControllers(): Array<ControllerDetails> {
    const ret = this.aControllerDetails_;
    debug('AllRoutes::get allControllers', ret);

    return ret;
  }
}

//Reflect.defineMetadata(SYM_COMPONENT_TYPE, ComponentType.COMPONENT, AllRoutes);
//Reflect.defineMetadata(SYM_COMPONENT_NAME, SYM_ALL_ROUTES, AllRoutes);

export {
  AllRoutes,
  SYM_ALL_ROUTES
}
