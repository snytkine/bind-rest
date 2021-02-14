import * as http from 'http';

/**
 * @todo use util type like Omit<> to exclude some headers that cannot be
 * in outgoing headers, example user-agent, if-modified-since, etc.
 * Not sure if it will make sense because IncomingHttpHeaders extends the Dict<string> so
 * it means that any value allowed as key as long as it is a string.
 */
export type IResponseHeaders = http.IncomingHttpHeaders;
