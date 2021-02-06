import * as url from 'url';
import { UrlWithStringQuery } from 'url';
import * as http from 'http';
import * as QueryString from 'querystring';
import { ParsedUrlQuery } from 'querystring';
import * as cookie from 'cookie';
import {
  Component,
  ComponentScope,
  Identity,
  IScopedComponentStorage,
  isSameIdentity,
  Scope,
  ComponentIdentity,
  Maybe,
} from 'bind-di';
import { IUriParams } from 'holiday-router';
import HttpStatusCode from 'http-status-enum';
import lowercaseKeys from 'lowercase-keys';
import { IAppResponse, IAppResponseMaybeJson } from '../lib/interfaces/appresponse';
import { IStoredComponent } from '../lib/interfaces/storedcomponent';
import { IContextStore } from '../lib/types/contextstore';

const debug = require('debug')('bind:rest:context');

const TAG = 'ContextClass';

@Component
@Scope(ComponentScope.REQUEST)
export default class Context implements IScopedComponentStorage {
  static readonly id: ComponentIdentity = Identity(Context);

  public static readonly create = (req: http.IncomingMessage) => {
    const instance = new Context();
    instance.setRequest(req);
    return instance;
  };

  public req: http.IncomingMessage;

  private reqUrl: string;

  private uriInfo: UrlWithStringQuery;

  private cookies;

  private myControllerName = '';

  private myRouteParams: IUriParams;

  /**
   * @todo this should be something like ServerResponse.HttpResponseHeaders
   * @private
   */
  private responseHeaders: NodeJS.Dict<string> = {};

  private responseStatusCode: HttpStatusCode;

  public setHeader(key: string, value: string) {
    this.responseHeaders[key] = value;
  }

  public setStatusCode(statusCode: HttpStatusCode) {
    this.responseStatusCode = statusCode;
  }

  /**
   * Parsed url query
   */
  private query: ParsedUrlQuery;

  private requestStartTime: number = 0;

  private response: IAppResponse;

  set appResponse(response: IAppResponseMaybeJson) {
    this.response = response;
  }

  get appResponse(): Maybe<IAppResponseMaybeJson> {
    if (!this.response) {
      return undefined;
    }

    if (this.responseStatusCode) {
      this.response.statusCode = this.responseStatusCode;
    }
    /**
     * Normalize response headers to lower case names.
     * Values set explicitely with context.setHeader() override values returned in IAppResponse
     */

    /**
     * @todo deal with cookies. Merge cookies from response with cookies set with setCookie.
     * Append a set-cookie header with stringified value of all cookies
     */
    this.response.headers = { ...lowercaseKeys(this.responseHeaders), ...this.response.headers };

    return this.response;
  }

  private scopedComponents: Array<IStoredComponent> = [];

  /**
   * Storage container for anything
   */
  readonly storage: IContextStore = {};

  /**
   * Sometimes Errors that are not critical should not cause
   * request to fail, but we also don't want to ignore errors
   * One way to preserve errors is to add then to this array
   * so that after the response is sent a custom logger afterware may be used
   * to log these errors
   */
  readonly errors: Array<Error> = [];

  readonly scope = ComponentScope.REQUEST;

  setRequest(req: http.IncomingMessage): Context {
    this.req = req;
    this.reqUrl = req.url;
    this.requestStartTime = Date.now();

    return this;
  }

  get startTime() {
    return this.requestStartTime;
  }

  getComponent(id: ComponentIdentity): Maybe<Object> {
    /**
     * Special case if looking for instance of Context (this object)
     * then just return this
     * otherwise look in scopedComponents map
     */
    if (isSameIdentity(id, Context.id)) {
      debug('%s getComponent Returning instance of self', TAG);

      return this;
    }

    const res = this.scopedComponents.find((component) => isSameIdentity(component.identity, id));

    return res?.component;
  }

  setComponent(identity: ComponentIdentity, component: any): void {
    /**
     * Special case do not set Context instance (instance of this class)
     * into storage
     */
    if (!isSameIdentity(identity, Context.id)) {
      /**
       * Not testing if component with same identity
       * already exists before adding it. The consumer of this method
       * is part of bind framework and it already checks if
       * component exists in scoped storage and only adds new object
       * into scoped storage if component is not found in storage
       */
      this.scopedComponents.push({ identity, component });
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
      throw new Error(
        `Controller name is already set to '${this.myControllerName}' Cannot set new value '${name}'`,
      );
    }
  }

  get path() {
    return this.parsedUrl.pathname;
  }

  get requestUrl() {
    return this.reqUrl;
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

    if (this.req.headers?.cookie) {
      try {
        this.cookies = cookie.parse(this.req.headers.cookie);
      } catch (e) {
        debug('% Failed to parse cooke header %s', TAG, e.mesage);
        this.cookies = {};
      }
    } else {
      debug('%s NO cookie header in request');
      this.cookies = {};
    }

    return this.cookies;
  }

  controllerArguments: Array<any> = [];

  /**
   * Request body parsed as Json
   * The result is cached in the variable.
   * This way multiple call to parse body as json can be
   * made safely.
   * The BodyParam decorator may be used multiple times in the same
   * controller and each one will be calling the parseJsonBody.
   * @todo maybe use setter and getter.
   */
  parsedBody: any;
}
