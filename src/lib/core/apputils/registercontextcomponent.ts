import {
  ComponentScope,
  Identity,
  IfIocComponent,
  IScopedComponentStorage,
  IfIocContainer,
} from 'bind';
import Context from '../context';

const contextComponentDetails: IfIocComponent = {
  identity: Identity(Context),
  propDependencies: [],
  constructorDependencies: [],
  scope: ComponentScope.REQUEST,
  extraDependencies: [],
  get: (storages: IScopedComponentStorage[]) => {
    const storage = storages.find(x => x.scope===ComponentScope.REQUEST);
    if (storage) {
      return storage;
    }
  },

};

/**
 * This function must be called before container.init runs
 * this way container will be aware of the Context component and will know how to
 * get it.
 * @param container
 */
const registerComponents = (container: IfIocContainer): void => {
  container.addComponent(contextComponentDetails);
};

export { registerComponents, contextComponentDetails };
