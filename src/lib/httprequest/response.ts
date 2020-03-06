import ReadableStream = NodeJS.ReadableStream;
import {IAppResponse, AppResponse} from "../";
import * as charSet from 'charset';
import {JsonResponse} from "../core/appresponse";

/**
 * Supported character encoding:
 * https://nodejs.org/api/buffer.html
 *
 */
const supportedEncodings = [
    'ascii',
    'base64',
    'binary',
    'hex',
    'usc2',
    'usc-2',
    'utf8',
    'utf-8',
    'latin1',
    'utf16le',
    'utf-16le'
];

const debug = require('debug')('promiseoft:httprequest');
import * as stream from 'stream';

export class HttpStringResponse extends AppResponse implements IAppResponse {

    constructor(b: string = "", public statusCode: number, readonly headers: { [key: string]: string }) {
        super(b, statusCode, headers)
    }

    get body(): string {
        return this._body;
    }
}


export class HttpResponse implements IAppResponse {
    constructor(public statusCode: number, public headers: { [key: string]: any }, private _readStream: ReadableStream, public readonly requestID: string = "-") {
    }

    public getReadStream() {
        return this._readStream;
    }
}

export class HttpErrorResponse extends HttpResponse {

    constructor(statusCode: number, error: string = "", headers: { [key: string]: any } = {}, requestID: string = "-") {
        let bufferStream = new stream.PassThrough();
        bufferStream.end(error);
        super(statusCode, headers, bufferStream, requestID)
    }
}


/**
 * Function to convert stream in the Http Response into string body
 * This function can be used at a .then function to transform
 * Promise<HttpResponse> into Promise<HttpStringResponse>
 * Such transformation is necessary if the body of http response has to be parsed as JSON
 * because response body must first be turned into a string before JSON.parse can be called on the body
 *
 * Example promiseHttpResponse.then(stringifyBody).then(resp => JSON.parse(resp.body))
 *
 * @param resp: HttpResponse
 * @returns {Promise<HttpStringResponse>}
 */
export function stringifyBody(resp: HttpResponse): Promise<HttpStringResponse> {

    const is = resp.getReadStream();
    let cs: string;
    if (resp.headers && resp.headers['content-type']) {
        debug('Have content-type header in response: %s', resp.headers['content-type']);
        cs = charSet(resp.headers['content-type']);
        cs = cs && cs.toLocaleLowerCase();
        debug(`Charset from response: %s`, cs);
        /**
         * Node.js stream supports latin1 but not iso-8859-1 (these are the same, but node.js only
         * supports it by 'latin1' name
         * win-1252 is not supported
         */
        if (cs === 'iso-8859-1' || cs === 'iso8859-1' || cs === 'latin-1' || cs === 'iso88591') {
            debug('Changed charset to latin1');
            cs = 'latin1';
        }
    }

    if (cs) {
        if (!supportedEncodings.includes(cs)) {
            debug('Unknown encoding: ', cs);
        } else {
            is.setEncoding(cs);
        }
    }

    return new Promise(function (resolve, reject) {
        let str = "";
        is.on('data', function (data) {
            str += data.toString()
        });
        is.on('end', function () {
            resolve(new HttpStringResponse(str, resp.statusCode, resp.headers));

        });
        is.on('error', function (err) {
            reject(err)
        })
    })

}


export function jsonParseBody(resp: HttpStringResponse): Promise<JsonResponse> {

    return new Promise((resolve, reject) => {

        const body = resp.body;
        const contentType = resp.headers['content-type'] || '';

        try {
            const json = JSON.parse(body);

            resolve(new JsonResponse(json, resp.statusCode, resp.headers));
        } catch (e) {

            reject(new Error(`Failed to parse response as JSON. error="${e.message}" response contentType="${contentType}" body=${body}`));
        }
    })

}
