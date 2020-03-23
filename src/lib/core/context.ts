import * as url from 'url';
import * as http from 'http';
import * as QueryString from 'querystring';
import * as cookie from 'cookie';
import { IAppResponse } from '../interfaces/appresponse';
import { UrlWithStringQuery } from 'url';
import { ParsedUrlQuery } from 'querystring';
import {
  IScopedComponentStorage,
  IfComponentIdentity,
  ComponentScope,
  StringOrSymbol,
  Identity,
  isSameIdentity,
} from 'bind';
import { SERVER_REQUEST, SERVER_RESPONSE } from '../consts';
import { IUriParams } from 'holiday-router';

const debug = require('debug')('promiseoft:context');
const TAG = 'ContextClass';

export default class Context implements IScopedComponentStorage {

  private readonly id: IfComponentIdentity;
  public readonly req: http.IncomingMessage;
  public readonly res: http.ServerResponse;
  private readonly reqUrl: string;
  private uriInfo: UrlWithStringQuery;
  private cookies;
  private myControllerName = '';
  private myRouteParams: IUriParams;
  /**
   * Parsed url query
   */
  private query: ParsedUrlQuery;

  /**
   * Path params injected by router
   */
  params: { [key: string]: string };

  readonly startTime: number;

  appResponse: IAppResponse;

  private scopedComponents: Array<[IfComponentIdentity, any]>;

  /**
   * Storage container for anything
   */
  readonly storage: Map<StringOrSymbol, any>;

  readonly scope = ComponentScope.REQUEST;

  constructor(req: http.IncomingMessage, res: http.ServerResponse) {
    this.req = req;
    this.res = res;
    this.reqUrl = req.url;
    this.startTime = Date.now();
    this.id = Identity(Context);
  }

  getComponent(id: IfComponentIdentity) {

    /**
     * Special case if looking for instance of Context (this object)
     * then just return this
     * otherwise look in scopedComponents map
     */
    if (isSameIdentity(id, this.id)) {
      debug('%s getComponent Returning instance of self', TAG);

      return this;
    } else if (id.componentName===SERVER_REQUEST) {
      debug('%s getComponent returning .req', TAG);

      return this.req;
    } else if (id.componentName===SERVER_RESPONSE) {
      debug('%s getComponent returning .res', TAG);

      return this.res;
    }

    return this.scopedComponents.find(component => isSameIdentity(component[0], id));
  }

  setComponent(id: IfComponentIdentity, component: any): void {

    /**
     * Special case do not set Context instance (instance of this class)
     * into storage
     */
    if (!isSameIdentity(id, this.id)) {
      /**
       * Not testing if component with same identity
       * already exists before adding it. The consumer of this method
       * is part of bind framework and it already checks if
       * component exists in scoped storage and only adds new object
       * into scoped storage if component is not found in storage
       */
      this.scopedComponents.push([id, component]);
    }

  }

  get controllerName() {
    return this.myControllerName;
  }

  get routeParams(): IUriParams {
    return this.myRouteParams;
  }

  set routeParams(params: IUriParams) {
    if (!this.myRouteParams) {
      this.myRouteParams = params;
    } else {
      throw new Error('routeParams is already set Cannot set new value');
    }
  }

  set controllerName(name: string) {
    if (!this.myControllerName) {
      this.myControllerName = name;
    } else {
      throw new Error(`Controller name is already set to '${this.myControllerName}' Cannot set new value '${name}'`);
    }
  }

  get path() {
    return this.parsedUrl.pathname;
  }

  get requestUrl() {
    return this.reqUrl;
  }

  get request() {
    return this.req;
  }

  get response() {
    return this.res;
  }

  get parsedUrl(): UrlWithStringQuery {
    if (!this.uriInfo) {
      this.uriInfo = url.parse(this.reqUrl);
    }

    return this.uriInfo;
  }

  get querystring(): string {
    const uri = this.parsedUrl;
    return uri?.query;
  }

  get parsedUrlQuery(): ParsedUrlQuery {
    if (!this.query) {
      this.query = QueryString.parse(this.querystring);
    }

    return this.query;
  }

  get parsedCookies() {
    if (this.cookies) return this.cookies;

    this.cookies = cookie.parse(this.req.headers.cookie);

    return this.cookies;

    //throw new Error('cookies() getter not implemented in context');
  }

  controllerArguments: Array<any> = [];

}
