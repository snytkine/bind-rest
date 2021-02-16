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
  isSameIdentity,
  Scope,
  ComponentIdentity,
  Maybe,
} from 'bind-di';
import { IUriParams } from 'holiday-router';
import HttpStatusCode from 'http-status-enum';
import lowercaseKeys from 'lowercase-keys';
import HTTPMethod from 'http-method-enum';
import { IAppResponse } from '../lib/interfaces/appresponse';
import { IStoredComponent } from '../lib/interfaces/storedcomponent';
import { IContextStore } from '../lib/types/contextstore';
import { IBindRestContext } from '../lib/interfaces/icontext';
import { IResponseCookieValue } from '../lib/interfaces/responsecookie';

const debug = require('debug')('bind:rest:context');

const TAG = 'ContextClass';

@Component
@Scope(ComponentScope.REQUEST)
export default class BindRestContext implements IBindRestContext {
  static readonly id: ComponentIdentity = Identity(BindRestContext);

  public contextType = 'BindRestContext';

  protected readonly responseCookies: NodeJS.Dict<IResponseCookieValue> = {};

  public static readonly create = (req: http.IncomingMessage) => {
    const instance = new BindRestContext();
    instance.req = req;
    return instance;
  };

  protected httpRequestBody: string;

  protected httpRequest?: http.IncomingMessage;

  protected httpRequestMethod: HTTPMethod;

  protected reqUrl: string;

  protected uriInfo: UrlWithStringQuery;

  /**
   * These are name=>value for parsed Request Cookies
   * @protected
   */
  protected cookies;

  /**
   * Parsed url query
   */
  protected query: ParsedUrlQuery;

  protected myControllerName: string = '';

  protected myRouteParams: IUriParams;

  /**
   * @todo this should be something like ServerResponse.HttpResponseHeaders
   */
  protected responseHeaders: NodeJS.Dict<string> = {};

  protected responseStatusCode: HttpStatusCode;

  /**
   * @todo change type to Date object. It's a much more precise type than number
   */
  protected requestStartTime: number = 0;

  protected response: IAppResponse;

  public setHeader(key: string, value: string) {
    this.responseHeaders[key] = value;
  }

  public setStatusCode(statusCode: HttpStatusCode) {
    this.responseStatusCode = statusCode;
  }

  get req(): http.IncomingMessage {
    return this.httpRequest;
  }

  set req(req: http.IncomingMessage) {
    this.httpRequest = req;
    this.reqUrl = req.url;
    this.httpRequestMethod = req.method.toUpperCase() as HTTPMethod;
    this.requestStartTime = Date.now();
  }

  get requestHeaders(): http.IncomingHttpHeaders {
    return this.req.headers;
  }

  get requestBody(): string | undefined {
    return this.httpRequestBody;
  }

  set requestBody(body: string) {
    this.httpRequestBody = body;
  }

  get requestMethod(): HTTPMethod {
    return this.httpRequestMethod;
  }

  set appResponse(response: IAppResponse) {
    this.response = response;
  }

  get appResponse(): Maybe<IAppResponse> {
    if (!this.response) {
      return undefined;
    }

    if (this.responseStatusCode) {
      this.response.statusCode = this.responseStatusCode;
    }
    /**
     *
     * Values set explicitly with context.setHeader() override values returned in IAppResponse
     */
    this.response.headers = { ...lowercaseKeys(this.responseHeaders), ...this.response.headers };
    /**
     * Merge cookies from response with cookies set with setCookie. cookie set with context setResponseCookie
     * overrides cookies passed in IAppResponse
     */
    if(this.appResponse.cookies){
      this.appResponse.cookies = {...this.appResponse.cookies, ...this.responseCookies }
    } else {
      this.appResponse.cookies = this.responseCookies;
    }


    return this.response;
  }

  protected scopedComponents: Array<IStoredComponent> = [];

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

  /**
   * Implements IScopedComponentStorage
   */
  readonly scope = ComponentScope.REQUEST;

  get startTime() {
    return this.requestStartTime;
  }

  /**
   * Implements IComponentStorage
   * @param id
   */
  getComponent(id: ComponentIdentity): Maybe<Object> {
    /**
     * Special case if looking for instance of BindRestContext (this object)
     * then just return this
     * otherwise look in scopedComponents map
     */
    if (isSameIdentity(id, BindRestContext.id)) {
      debug('%s getComponent Returning instance of self', TAG);

      return this;
    }

    const res = this.scopedComponents.find((component) => isSameIdentity(component.identity, id));

    return res?.component;
  }

  /**
   * Implements IComponentStorage
   * @param identity
   * @param component
   */
  setComponent(identity: ComponentIdentity, component: any): void {
    /**
     * Special case do not set BindRestContext instance (instance of this class)
     * into storage
     */
    if (!isSameIdentity(identity, BindRestContext.id)) {
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
    return this.parseUrl().pathname;
  }

  get requestUrl() {
    return this.reqUrl;
  }

  private parseUrl(): UrlWithStringQuery {
    if (!this.uriInfo) {
      this.uriInfo = url.parse(this.reqUrl);
    }

    return this.uriInfo;
  }

  get querystring(): string {
    const uri = this.parseUrl();
    return uri?.query || '';
  }

  get parsedUrlQuery(): ParsedUrlQuery {
    if (!this.query) {
      this.query = QueryString.parse(this.querystring);
    }

    return this.query;
  }

  get parsedCookies() {
    if (this.cookies) return this.cookies;

    if (this.requestHeaders.cookie) {
      try {
        this.cookies = cookie.parse(this.requestHeaders.cookie);
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

  getResponseCookies(): NodeJS.Dict<IResponseCookieValue> {
    return this.responseCookies;
  }

  setResponseCookie(name: string, value: IResponseCookieValue): void {
    this.responseCookies[name] = value;
  }
}
