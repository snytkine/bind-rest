import { IExitHandler } from '../../interfaces/exithandler';

const debug = require('debug')('promiseoft:core');
const TAG = 'PROCESS-EVENTS-HANDLER';

export function registerProcessEventListeners(o: IExitHandler) {
  debug(`${TAG} Registering IExitHandler`);

  process.on('SIGINT', () => {
    console.error(`${TAG} SIGINT event received`);
    o.onExit(2).then(code => {
      debug(`${TAG} SIGINT onExit finished`);
      return code;
    }).then(code => {
      process.exit(code);
    });
  });


  process.on('SIGTERM', (code) => {
    console.error(`${TAG} SIGTERM event received`);
    o.onExit(0).then(code => {
      debug(`${TAG} SIGTERM onExit finished`);
      return code;
    }).then(code => {
      process.exit(code);
    });
  });

  process.on('SIGHUP', (code) => {
    console.error(`${TAG} SIGHUP event received`);
    o.onExit(9).then(code => {
      debug(`${TAG} SIGHUP onExit finished`);
      return code;
    }).then(code => {
      process.exit(code);
    });
  });

  process.on('uncaughtException', (err) => {
    console.error(`${TAG} uncaughtException event received: ${err}`);
    o.onExit(5).then(() => {
      debug(`${TAG} uncaughtException onExit finished`);
    }).then(() => {
      process.exit(5);
    });

  });


  process.on('warning', (warning) => {
    console.error(`${TAG} onWarning event warningName=${warning.name} warningMessage=${warning.message} warningStack=${warning.stack}`);    // Print the warning name
  });

  process.on('exit', function (i) {
    debug(`${TAG} onExit Event exitCode=${i}`);
  });


  process.on('beforeExit', function (i) {
    debug(`${TAG} beforeExit Event received exitCode=${i}`);
  });


  process.on('unhandledRejection', (reason, p) => {
    console.error(`${TAG} Unhandled Rejection 'reason:' ${reason} Promise: ${p}`);
  });

  process.on('rejectionHandled', (p) => {
    debug(`${TAG} rejection handled ${p}`);
  });

}
