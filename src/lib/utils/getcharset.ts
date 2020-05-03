import { IncomingHttpHeaders } from 'http';
import charSet from 'charset';
import SUPPORTED_CHARSET from '../consts/charset';
import { Maybe } from 'bind-di';

const debug = require('debug')('bind:rest:httprequest');

export default function getCharset(headers: IncomingHttpHeaders,
                                   defaultCharset?: string): Maybe<string> {

  let cs: string;
  if (headers && headers['content-type']) {
    debug('Have content-type header in response: %s', headers['content-type']);
    cs = charSet(headers['content-type']);
    cs = cs || defaultCharset;
    cs = cs && cs.toLocaleLowerCase();
    debug(`Charset from response: %s`, cs);

    /**
     * Node.js stream supports latin1 but not iso-8859-1 (these are the same, but node.js only
     * supports it by 'latin1' name
     * win-1252 is not supported
     */
    if (cs==='iso-8859-1' || cs==='iso8859-1' || cs==='latin-1' || cs==='iso88591') {
      debug('Changed charset to latin1');
      cs = 'latin1';
    } else if (cs==='utf-8') {
      cs = 'utf8';
    } else if (cs==='usc-2') {
      cs = 'usc2';
    } else if (cs==='utf-16le') {
      cs = 'utf16le';
    }
  }

  if (SUPPORTED_CHARSET[cs]) {
    return cs;
  }

  return undefined;
}
