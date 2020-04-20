import { ComponentIdentity } from 'bind-di';

/**
 * Object stored in Context (in IScopedComponentStorage)
 * has this structure
 */
export interface IStoredComponent {
  identity: ComponentIdentity;
  component: any;
}
