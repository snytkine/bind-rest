import * as url from 'url';
import { UrlWithStringQuery } from 'url';
import * as http from 'http';
import * as QueryString from 'querystring';
import { ParsedUrlQuery } from 'querystring';
import * as cookie from 'cookie';
import { IAppResponse } from '../lib/interfaces/appresponse';
import {
  Component,
  ComponentScope,
  Identity,
  IScopedComponentStorage,
  isSameIdentity,
  Scope,
  StringOrSymbol,
  ComponentIdentity
} from 'bind';
import { IUriParams } from 'holiday-router';

const debug = require('debug')('promiseoft:context');
const TAG = 'ContextClass';

@Component
@Scope(ComponentScope.REQUEST)
export default class Context implements IScopedComponentStorage {

  static readonly id: ComponentIdentity = Identity(Context);
  public req: http.IncomingMessage;
  public res: http.ServerResponse;
  private reqUrl: string;
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

  private requestStartTime: number = 0;

  appResponse: IAppResponse;

  private scopedComponents: Array<[ComponentIdentity, any]> = [];

  /**
   * Storage container for anything
   */
  readonly storage: Map<StringOrSymbol, any>;

  readonly scope = ComponentScope.REQUEST;

  init(req: http.IncomingMessage, res: http.ServerResponse): Context {
    this.req = req;
    this.res = res;
    this.reqUrl = req.url;
    this.requestStartTime = Date.now();

    return this;
  }

  get startTime(){
    return this.requestStartTime;
  }

  getComponent(id: ComponentIdentity) {

    /**
     * Special case if looking for instance of Context (this object)
     * then just return this
     * otherwise look in scopedComponents map
     */
    if (isSameIdentity(id, Context.id)) {
      debug('%s getComponent Returning instance of self', TAG);

      return this;
    }

    return this.scopedComponents.find(component => isSameIdentity(component[0], id));
  }

  setComponent(id: ComponentIdentity, component: any): void {

    /**
     * Special case do not set Context instance (instance of this class)
     * into storage
     */
    if (!isSameIdentity(id, Context.id)) {
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
