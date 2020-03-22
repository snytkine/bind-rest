import { IfIocContainer, IfIocComponent, COMPONENT_META_DATA } from 'bind';
import { IS_CONTROLLER } from '../../decorators';

/**
 * This function is for filtering out only Controller components
 * from container's components
 *
 * @param container
 */
export default function getControllerComponents(container: IfIocContainer): Array<IfIocComponent> {
  return container.components.filter(comp => {
    return comp.componentMetaData !== undefined && comp.componentMetaData[IS_CONTROLLER]===true;
  });
}
