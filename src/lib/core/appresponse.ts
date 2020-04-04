/**
 * Created by snytkind on 12/7/16.
 */
import HttpResponseCode from 'http-status-enum';
import HTTP_STATUS_CODES from 'http-status-enum';
import * as stream from 'stream';
import { IAppResponse } from '../interfaces/appresponse';

import ReadableStream = NodeJS.ReadableStream;

export type ResponseHeaders = { [key: string]: string };

export class AppResponse implements IAppResponse {
  protected readonly responseBody: string;

  constructor(
    b: string = '',
    public statusCode: number = HttpResponseCode.OK,
    readonly headers: ResponseHeaders = { 'content-type': 'text/plain' },
  ) {
    this.responseBody = b;
  }

  getReadStream() {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(this.responseBody);
    return bufferStream;
  }
}

export class RedirectResponse extends AppResponse {
  constructor(
    public readonly redirectUrl: string,
    responseCode: number = HttpResponseCode.MOVED_PERMANENTLY,
  ) {
    super('', responseCode, { Location: redirectUrl });
  }
}

export class JsonResponse extends AppResponse {
  constructor(
    private readonly resonseJson: {},
    statusCode = HttpResponseCode.OK,
    readonly headers: ResponseHeaders = { 'content-type': 'application/json' },
  ) {
    super(JSON.stringify(resonseJson), statusCode, headers);
  }

  get json() {
    return this.resonseJson;
  }
}

export class ErrorResponse extends AppResponse {
  constructor(
    responseCode: HttpResponseCode,
    message: string = 'Internal Application Error',
    readonly headers: ResponseHeaders = { 'content-type': 'text/plain' },
  ) {
    super(message, responseCode);
  }
}

export class StreamResponse implements IAppResponse {
  private rs: ReadableStream;

  constructor(
    rs: ReadableStream,
    public statusCode: HttpResponseCode = HTTP_STATUS_CODES.OK,
    public headers: ResponseHeaders = {},
  ) {
    this.rs = rs;
  }

  public getReadStream() {
    return this.rs;
  }
}
