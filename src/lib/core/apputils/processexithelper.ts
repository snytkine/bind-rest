import { IExitHandler } from '../../interfaces/exithandler';

const debug = require('debug')('bind:rest:core');

const TAG = 'PROCESS-EVENTS-HANDLER';

export default function registerProcessEventListeners(o: IExitHandler) {
  debug(`${TAG} Registering IExitHandler`);

  process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.error(`${TAG} SIGINT event received`);
    o.onExit(2)
      .then((code) => {
        debug(`${TAG} SIGINT onExit finished`);
        return code;
      })
      .then((code) => {
        process.exit(code);
      });
  });

  process.on('SIGTERM', (code) => {
    // eslint-disable-next-line no-console
    console.error(`${TAG} SIGTERM event received with code=${code}`);
    o.onExit(0)
      .then((excode) => {
        debug(`${TAG} SIGTERM onExit finished`);
        return excode;
      })
      .then((vcode) => {
        process.exit(vcode);
      });
  });

  process.on('SIGHUP', (code) => {
    // eslint-disable-next-line no-console
    console.error(`${TAG} SIGHUP event received with code=${code}`);
    o.onExit(9)
      .then((xcode) => {
        debug(`${TAG} SIGHUP onExit finished with code=${xcode}`);
        return xcode;
      })
      .then((vcode) => {
        process.exit(vcode);
      });
  });

  process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error(`${TAG} uncaughtException event received: ${err}`);
    o.onExit(5)
      .then(() => {
        debug(`${TAG} uncaughtException onExit finished`);
      })
      .then(() => {
        process.exit(5);
      });
  });

  process.on('warning', (warning) => {
    // eslint-disable-next-line no-console
    console.error(
      `${TAG} onWarning event 
      warningName=${warning.name} 
      warningMessage=${warning.message} 
      warningStack=${warning.stack}`,
    );
  });

  process.on('exit', function onExit(i) {
    debug(`${TAG} onExit Event exitCode=${i}`);
  });

  process.on('beforeExit', function onBeforeExit(i) {
    debug(`${TAG} beforeExit Event received exitCode=${i}`);
  });

  process.on('unhandledRejection', (reason, p) => {
    // eslint-disable-next-line no-console
    console.error(`${TAG} Unhandled Rejection 'reason:' ${reason} Promise: ${p}`);
  });

  process.on('rejectionHandled', (p) => {
    debug(`${TAG} rejection handled ${p}`);
  });
}
