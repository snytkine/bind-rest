import { IfIocContainer, arrayNotEmpty, Identity } from 'bind';
import { HttpRouter } from 'holiday-router';
import getControllerComponents from './getcontrollercomponents';
import { parseController } from '../parsecontroller';
import { IControllerDetails } from '../../interfaces';
import { ApplicationError } from '../apperrors';
import { FrameworkController } from '../index';

const debug = require('debug')('promiseoft:context');

const TAG = 'SetupRoutes';

export default function setupRoutes(container: IfIocContainer) {
  const controllerComponents = getControllerComponents(container);
  debug('% Found %d controller components', TAG, controllerComponents.length);

  const parsedControllers: Array<IControllerDetails> = controllerComponents
    .map((c) => {
      return parseController(container)(c);
    })
    .flat();
  console.log('===== parsedControllers =====');
  console.dir(parsedControllers, { depth: 4 });

  if (!arrayNotEmpty(parsedControllers)) {
    throw new ApplicationError('No Controller components found');
  }

  const router: HttpRouter<FrameworkController> = container.getComponent(Identity(HttpRouter));
  parsedControllers.forEach((controllerDetails) => {
    controllerDetails.requestMethods.forEach((method) => {
      router.addRoute(
        method,
        controllerDetails.routePath,
        new FrameworkController(controllerDetails),
      );
    });
  });
}
