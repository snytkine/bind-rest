/**
 * Created by snytkind on 12/7/16.
 */
import { IAppResponse } from '../interfaces/appresponse'
import HttpResponseCode from 'http-status-enum';
import HTTP_STATUS_CODES from 'http-status-enum';
import * as stream from 'stream';
import ReadableStream = NodeJS.ReadableStream

export type ResponseHeaders = { [key: string]: string };


export class AppResponse implements IAppResponse {
  protected readonly _body: string;

  constructor(b: string = "", public statusCode: number = HttpResponseCode.OK, readonly headers: ResponseHeaders = {'content-type': 'text/plain'}) {
    this._body = b;
  }

  getReadStream() {

    let bufferStream = new stream.PassThrough();
    bufferStream.end(this._body);
    return bufferStream;
  }

}


export class RedirectResponse extends AppResponse {

  constructor(public readonly redirectUrl: string, responseCode: number = HttpResponseCode.MOVED_PERMANENTLY) {
    super("", responseCode, {'Location': redirectUrl});
  }

}


export class JsonResponse extends AppResponse {

  constructor(private readonly json_: {}, statusCode = HttpResponseCode.OK, readonly headers: ResponseHeaders = {'content-type': 'application/json'}) {
    super(JSON.stringify(json_), statusCode, headers);
  }


  get json(){
    return this.json_;
  }

}


export class ErrorResponse extends AppResponse {

  constructor(responseCode: HttpResponseCode, message: string = "Internal Application Error", readonly headers: ResponseHeaders = {'content-type': 'text/plain'}) {
    super(message, responseCode);
  }
}

export class StreamResponse implements IAppResponse {

  private rs_: ReadableStream
  constructor(rs: ReadableStream, public statusCode: HttpResponseCode = HTTP_STATUS_CODES.OK, public headers: ResponseHeaders = {}){
    this.rs_ = rs;
  }

  public getReadStream(){
    return this.rs_;
  }
}
