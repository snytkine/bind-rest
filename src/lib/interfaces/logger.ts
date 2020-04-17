/**
 * Simple logger interface
 */
export interface ILogger {
  debug: (...messages: any[]) => any;
  info: (...messages: any[]) => any;
  warn: (...messages: any[]) => any;
  error: (...messages: any[]) => any;
  fatal: (...messages: any[]) => any;
}
