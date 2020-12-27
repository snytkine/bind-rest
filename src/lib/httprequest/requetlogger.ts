import http from 'http';
import { ILogger } from '../interfaces';

/**
 * Wrapper helper function to create custom
 * version of Logger that has instance of headers
 * available to logging calls, so there is no need
 * to pass headers as last param to every logging calls
 *
 * @param {ILogger} logger
 * @param {Object} headers
 * @returns {ILogger}
 */
export default function requestLogger(logger: ILogger, headers: http.IncomingHttpHeaders): ILogger {
  const reqLogger = {
    info(...messages: any[]): ILogger {
      logger.info(...messages, headers);
      return this;
    },

    error(...messages: any[]): ILogger {
      logger.error(...messages, headers);
      return this;
    },

    warn(...messages: any[]): ILogger {
      logger.warn(...messages, headers);
      return this;
    },

    debug(...messages: any[]): ILogger {
      logger.debug(...messages, headers);
      return this;
    },

    fatal(...messages: any[]): ILogger {
      logger.fatal(...messages, headers);
      return this;
    },
  };

  return reqLogger;
}
