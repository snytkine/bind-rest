import { IfIocContainer, IfIocComponent } from 'bind-di';
import { IS_CONTROLLER } from '../decorators/metaprops';

/**
 * This function is for filtering out only Controller components
 * from container's components
 *
 * @param container
 */
export default function getControllerComponents(container: IfIocContainer): Array<IfIocComponent> {
  return container.components.filter((comp) => {
    return comp.componentMetaData !== undefined && comp.componentMetaData[IS_CONTROLLER] === true;
  });
}
