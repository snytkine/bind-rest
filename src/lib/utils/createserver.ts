import http from 'http';
import { Application } from '../core';
import { ApplicationOptions } from '../interfaces';

const DEFAULT_PORT = 9099;
export default function createServer(config: ApplicationOptions) {
  const app = new Application(config);
  const APPLICATION_PORT =
    process.env.BIND_REST_HTTP_PORT && Number.parseInt(process.env.BIND_REST_HTTP_PORT, 10);

  const PORT = isNaN(APPLICATION_PORT) ? DEFAULT_PORT : APPLICATION_PORT;
  console.log(`STARTING APPLICATION on PORT=${PORT}. Please wait while application initializes`);

  app
    .init()
    .then((handler) => {
      console.log('Application loaded');
      console.log(app.toString());
      http.createServer(handler).listen(PORT);
      console.log(`Server running on port ${PORT}`);
    })
    .catch((e) => {
      console.error(`Container init failed ${e.message} ${e.stack}`);
      process.exit(1);
    });
}
