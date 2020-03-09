import {IContext} from "../interfaces/context";
import * as url from 'url';
import * as http from 'http';
import * as QueryString from 'querystring';
import * as cookie from 'cookie';
import {IAppResponse} from "../interfaces/appresponse";

const debug = require('debug')('promiseoft:context');
const TAG = "ContextClass";

export class Context {

    private readonly _req: http.IncomingMessage;
    private readonly _res: http.ServerResponse;
    private readonly _originalUrl: string;
    private _UriInfo: url.Url;
    private _cookies;
    private _controllerName = "";
    /**
     * Parsed url query
     */
    private _query: { [p: string]: string | string[] };

    /**
     * Path params injected by router
     */
    params: { [key: string]: string };

    readonly startTime: number;

    appResponse: IAppResponse;
    /**
     * Storage container for anything
     */
    readonly scope: { [p: string]: any };

    constructor(req: http.IncomingMessage, res: http.ServerResponse) {
        this._req = req;
        this._res = res;
        this._originalUrl = req.url;
        this.startTime = Date.now();
        this.scope = {};
    }

    get controllerName() {
        return this._controllerName;
    }

    set controllerName(name: string) {
        if (!this._controllerName) {
            this._controllerName = name;
        } else {
            console.error(`${TAG} ERROR. Controller name is already set to '${this._controllerName}' Cannot set new value '${name}'`);
        }
    }

    get method() {
        return this._req.method;
    }

    get path() {
        return this.UriInfo.pathname;
    }

    get originalUrl() {
        return this._originalUrl;
    }

    get req() {
        return this._req;
    }

    get res() {
        return this._res;
    }

    get UriInfo() {
        if (this._UriInfo) {
            return this._UriInfo;
        }

        this._UriInfo = url.parse(this._originalUrl);

        return this._UriInfo;
    }

    get querystring() {
        const uri = this.UriInfo;
        return uri.query || "";
    }

    get query() {
        if (this._query) {
            return this._query;
        }

        // @_ts-ignore
      this._query = QueryString.parse(this.querystring);

        return this._query;
    }

    get cookies() {
        if (this._cookies) return this._cookies;

        //this._cookies = cookie.parse(this._req.headers.cookie);

        //return this._cookies;

        throw new Error("cookies() getter not implemented in context");
    }

    controllerArguments: Array<any> = [];

    parsedBody: any;

}
