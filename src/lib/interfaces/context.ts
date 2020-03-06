/**
 * Created by snytkind on 12/4/16.
 */

import * as cookies from "cookies";
import * as http from "http";
import * as url from 'url';
import {IAppResponse} from "./appresponse";

export interface IMatched {
  methods: Array<string>
  [key: string]: any
}

export interface IContext {

  readonly req: http.IncomingMessage;
  readonly res: http.ServerResponse;
  readonly startTime:number;
  params: {[key: string]: string};
  method: string;
  path: string;
  query: {[key: string]: string|string[]};

  readonly querystring:string;
  /**
   * Storage of anything for the duration or request/response
   */
  readonly scope: {[key: string]: any}
  /**
   * Copied from req.url when request comes in
   * This way .url can be changed but this value should not be changed
   * Must be initialized only in Constructor when original req is passed to constructor
   * After that it should never be changed.
   */
  readonly originalUrl: string;

  appResponse: IAppResponse;

  cookies?: cookies.ICookies;

  UriInfo:url.Url

  controllerArguments: Array<any>;

  parsedBody: any;

  /**
   * controllerName is set when controller is called from the router, this is the first
   * think that is done when controller is called but before controller function finish running
   * This value is intended for logging purposes so logger can log
   * uri, method, params, return type, passed arguments and controller name
   */
  controllerName: string;

}
