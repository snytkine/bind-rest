import { IfIocContainer, arrayNotEmpty, Identity } from 'bind-di';
import { HttpRouter } from 'holiday-router';
import getControllerComponents from '../../utils/getcontrollercomponents';
import parseController from '../parsecontroller';
import { IControllerDetails } from '../../interfaces/controller';
import ApplicationError from '../../errors/applicationerror';
import FrameworkController from '../frameworkcontroller';

const debug = require('debug')('bind:rest:context');

const TAG = 'SetupRoutes';

export default function setupRoutes(container: IfIocContainer) {
  const controllerComponents = getControllerComponents(container);
  debug('%s Found %d controller components', TAG, controllerComponents.length);

  const parsedControllers: Array<IControllerDetails> = controllerComponents
    .map((c) => {
      return parseController(container)(c);
    })
    .flat();

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
