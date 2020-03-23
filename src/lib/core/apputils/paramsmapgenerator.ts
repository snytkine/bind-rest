import {ClassMethod, contextToParam} from "../../types/controllers";
import {SYM_METHOD_PARAMS} from "../../decorators/metaprops";
import {PathDetailsParam} from "../../interfaces/pathdetailsparams";
import {PathDetailsType} from "../../enums/pathdetails";
import Context from '../context'
const debug = require('debug')('promiseoft:util:paramsgenerator');
export function paramsMapGenerator(cm: ClassMethod): contextToParam[] {
  let [o, p] = cm;

  debug(`Entered paramsMapGenerator for ${o.constructor.name}.${p}`);

  const paramsMeta: Array<PathDetailsParam> = Reflect.getMetadata(SYM_METHOD_PARAMS, o, p);

  /**
   * The paramsMeta is this type of array of these: [{"type":2001,"name":"id","position":0}]
   * Map paramsMap to produce more readable objects where constant PathDetailsType is replaced
   * with its' string value. This is only for readability in the logs
   */
  if (paramsMeta && paramsMeta.length > 0) {
    debug(`~paramsMeta for ${p} ${JSON.stringify(paramsMeta.map(param => {
      return {...param, type: PathDetailsType[param.type]}
    })) }`);
  }

  if (!paramsMeta || paramsMeta.length === 0) {
    debug(`No Annotated params in ${o.constructor.name}.${p} Returning empty array generator`);
    return [];
  }

  let ret = paramsMeta.map(a => {
    let f: contextToParam;
    switch (a.type) {
      case PathDetailsType.PathParam:
        f = (ctx: Context) => ctx.params[a.name];
        break;

      case PathDetailsType.QueryParam:
        f = (ctx: Context) => ctx.query[a.name];
        break;

      case PathDetailsType.HeaderParam:
        f = (ctx: Context) => ctx.req.headers[a.name.toLocaleLowerCase()];
        break;

      case PathDetailsType.CookieParam:
        f = (ctx: Context) => ctx.cookies[a.name.toLocaleLowerCase()];
        break;

      case PathDetailsType.QueryString:
        f = (ctx: Context) => ctx.querystring;
        break;

      case PathDetailsType.Request:
        f = (ctx: Context) => ctx.req;
        break;

      case PathDetailsType.Response:
        f = (ctx: Context) => ctx.res;
        break;

      case PathDetailsType.OriginalUrl:
        f = (ctx: Context) => ctx.requestUrl;
        break;

      case PathDetailsType.UriInfo:
        f = (ctx: Context) => ctx.UriInfo;
        break;

      case PathDetailsType.Headers:
        f = (ctx: Context) => ctx.req.headers;
        break;

      case PathDetailsType.Context:
        f = (ctx: Context) => ctx;
        break;

      case PathDetailsType.ContextScope:
        f = (ctx: Context) => ctx.scope;
        break;

      case PathDetailsType.ContextScopeParam:
        f = (ctx: Context) => ctx.scope[a.name];
        break;

      case PathDetailsType.RequestMethod:
        f = (ctx: Context) => ctx.req.method;
        break;

      case PathDetailsType.RequestBody:
        f = (ctx: Context) => ctx.parsedBody;
        break;

      case PathDetailsType.Query:
        f = (ctx: Context) => ctx.query;
        break;

      default:
        f = () => void 0;
    }

    return f;

  });

  debug("Generated ExpectedArguments for %s.%s: %j", o.constructor.name, p, ret);

  return ret;

}
