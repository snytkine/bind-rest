import { IControllerContainer } from 'holiday-router';
import Context from '../../components/context';
import { IControllerMatcher, IController } from '../types';
import { IControllerDetails } from '../interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultMatcher = (ctx: Context) => true;

export default class FrameworkController implements IControllerContainer {
  public readonly controller: IController;

  public readonly id: string;

  public readonly priority: number;

  public readonly matcher: IControllerMatcher;

  constructor(controllerDetails: IControllerDetails) {
    this.controller = controllerDetails.ctrl;
    this.id = controllerDetails.name;
    this.priority = controllerDetails.priority || 0;
    this.matcher = controllerDetails.matcher || defaultMatcher;
  }

  equals(other: IControllerContainer) {
    return (
      other instanceof FrameworkController && other.id === this.id && other.matcher === this.matcher
    );
  }
}
