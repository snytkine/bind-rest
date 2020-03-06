/**
 * Created by snytkind on 2/20/17.
 */
const debug = require('debug')('promiseoft:util');

export function copyHeaders(headers: {[key: string]: any}, dropHeaders: Array<string> = []):{[key: string]: any} {
  let res = {};
  debug('Entered copyHeaders with: %o', headers);
  // 'host' header MUST NEVER be copied so it will always be added to the array
  dropHeaders.push('host');
  let keys = Object.keys(headers);
  keys = keys.filter(k => !dropHeaders.includes(k));
  for(const k of keys){
    res[k] = headers[k]
  }
  debug('Copied headers: ', res);

  return res;
}
