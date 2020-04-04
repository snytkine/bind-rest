import { IfIocContainer, IfIocComponent } from 'bind';
import { MIDDLEWARE_PRIORITY } from '../../decorators';

/**
 * This function is for filtering out only Controller components
 * from container's components
 *
 * @param container
 */
export default function getMiddlewareComponents(container: IfIocContainer): Array<IfIocComponent> {
  return container.components.filter((comp) => {
    return comp?.componentMetaData?.[MIDDLEWARE_PRIORITY] !== undefined;
  });
}
