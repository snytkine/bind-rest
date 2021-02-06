import http from 'http';
import { Application } from '../core';
import { ApplicationOptions } from '../interfaces';

const debug = require('debug')('bind:rest:runtime:application');

const DEFAULT_PORT = 9099;
export default function createServer(config: ApplicationOptions): Promise<string> {
  const app = new Application(config);
  const APPLICATION_PORT =
    process.env.BIND_REST_HTTP_PORT && Number.parseInt(process.env.BIND_REST_HTTP_PORT, 10);

  const PORT = !APPLICATION_PORT ? DEFAULT_PORT : APPLICATION_PORT;
  debug(`STARTING APPLICATION on PORT=${PORT}. Please wait while application initializes`);

  return app
    .init()
    .then(() => {
      debug('Application initialized');
      debug(app.toString());
      http.createServer(app.handleRequest.bind(app)).listen(PORT);
      const message = `Application "${app.toString()}" running on port ${PORT}`;
      debug(message);
      return message;
    })
    .catch((e) => {
      // eslint-disable-next-line
      console.error(`Application initialization failed ${e.message} ${e.stack}`);
      process.exit(1);
    });
}
