import { IControllerContainer } from 'holiday-router';
import { IController } from '../interfaces';
import Context from './context';

const defaultMatcher = (ctx: Context) => true;

export default class FrameworkController implements IControllerContainer {

  constructor(public readonly controller: IController,
              public readonly id: string,
              public readonly priority: number = 1,
              public readonly matcher: (ctx: Context) => boolean = defaultMatcher,
  ) {
  }

  equals(other: IControllerContainer) {
    return (
      other instanceof FrameworkController &&
      other.id===this.id &&
      other.matcher===this.matcher
    );
  }

}
