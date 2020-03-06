import {IExitHandler} from '../../interfaces/exithandler';
const debug = require('debug')('promiseoft:core');
const TAG = 'PROCESS-EVENTS-HANDLER';

export function registerProcessEventListeners(o: IExitHandler) {
  debug(`${TAG} Registering IExitHandler`);

  process.on('SIGINT', () => {
    console.error(`${TAG} SIGINT event received`);
    o.onExit().then(_ => {
      debug(`${TAG} SIGINT onExit finished`)
    }).then(_ => {
      process.exit(2);
    })
  });


  process.on('SIGTERM', () => {
    console.error(`${TAG} SIGTERM event received`);
    o.onExit().then(_ => {
      debug(`${TAG} SIGTERM onExit finished`)
    }).then(_ => {
      process.exit(3);
    })
  });

  process.on('SIGHUP', () => {
    console.error(`${TAG} SIGHUP event received`);
    o.onExit().then(_ => {
      debug(`${TAG} SIGHUP onExit finished`)
    }).then(_ => {
      process.exit(4);
    })
  });

  process.on('uncaughtException', (err) => {
    console.error(`${TAG} uncaughtException event received: ${err}`);
    o.onExit().then(_ => {
      debug(`${TAG} uncaughtException onExit finished`)
    }).then(_ => {
      process.exit(5);
    })

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