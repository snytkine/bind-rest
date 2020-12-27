import * as stream from 'stream';
import { StreamResponse } from '../core';
import { IHttpClientResponse } from '../interfaces/httpclientreponse';
import ReadableStream = NodeJS.ReadableStream;

const createErrorStream = (error: string): ReadableStream => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(error);

  return bufferStream;
};

export default class HttpErrorResponse extends StreamResponse implements IHttpClientResponse {
  constructor(
    statusCode: number,
    error: string = '',
    headers: { [key: string]: any } = {},
    public requestID: string,
  ) {
    super(createErrorStream(error), statusCode, headers);
  }
}
