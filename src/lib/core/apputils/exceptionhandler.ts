/**
 * Created by snytkind on 12/15/16.
 */
import HttpStatusCode from 'http-status-enum';
import * as http from 'http';


export function exceptionHandler(e: Error, req: http.IncomingMessage, res: http.ServerResponse) {
  /**
   * @todo log stacktrace
   */
  console.error(`Application Exception ${e.message} requestUrl: ${req.url} requestMethod: ${req.method}`);
  if (!res.finished) {
    try {
      res.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.end('Internal Server Error');
    } catch (ex) {
      console.error(`Default Exception handler failed`);
      console.error("Exception handler failed with error", ex);
    }
  } else {
    console.error(`Response was already sent`);
  }
}

