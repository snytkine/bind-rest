import {
  ComponentScope,
  getComponentMeta,
  IfIocComponent,
  IfIocContainer,
  IScopedComponentStorage,
  IocComponentGetter,
  Identity,
} from 'bind';
import { Context } from '../context';


export const SERVER_REQUEST = Symbol.for('bind:rest:component:server_request');
export const SERVER_RESPONSE = Symbol.for('bind:rest:component:server_response');

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
    get: contextGetter,
  };

};


export const makeRequestComponent = (container: IfIocContainer): IfIocComponent => {

  return {
    identity: Identity(SERVER_REQUEST),
    scope: ComponentScope.REQUEST,
    propDependencies: [],
    constructorDependencies: [],
    get: requestGetterFactory(container),
  };
};
