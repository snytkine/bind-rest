import {
  ComponentScope,
  IfIocComponent,
  IfIocContainer,
  IScopedComponentStorage,
  IocComponentGetter,
  Identity,
} from 'bind';
import Context from '../../../components/context';
import { SERVER_REQUEST } from '../../consts';

function contextGetter(scopedStorages?: Array<IScopedComponentStorage>): Context | undefined {
  let ret;
  if (scopedStorages) {
    ret = scopedStorages.find(storage => storage.scope===ComponentScope.REQUEST);
  }

  return ret;
}


function requestGetterFactory(container: IfIocContainer): IocComponentGetter {
  /**
   * Find Context component first, then get .req from it.
   */
  return (scopedStorages?: Array<IScopedComponentStorage>) => {
    const context: Context = container.getComponent(Identity(Context), scopedStorages);
    return context.req;
  };
}

export const makeContextComponent = (container: IfIocContainer): IfIocComponent => {

  return {
    identity: Identity(Context),
    scope: ComponentScope.REQUEST,
    propDependencies: [],
    constructorDependencies: [],
    extraDependencies: [],
    get: contextGetter,
  };

};


export const makeRequestComponent = (container: IfIocContainer): IfIocComponent => {

  return {
    identity: Identity(SERVER_REQUEST),
    scope: ComponentScope.REQUEST,
    propDependencies: [],
    constructorDependencies: [],
    extraDependencies: [],
    get: requestGetterFactory(container),
  };
};
