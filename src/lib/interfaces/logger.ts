/**
 * Simple logger interface
 * Popular logger package Winston implements this interface
 */
export interface ILogger {
  debug: (...messages: any[]) => ILogger;
  info: (...messages: any[]) => ILogger;
  warn: (...messages: any[]) => ILogger;
  error: (...messages: any[]) => ILogger;
}
