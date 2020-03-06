import {ClassMethod, contextToParam} from "../../types/controllers";
import {IContext} from "../../interfaces/context";
import {SYM_METHOD_PARAMS} from "../../decorators/metaprops";
import {PathDetailsParam} from "../../interfaces/pathdetailsparams";
import {PathDetailsType} from "../../enums/pathdetails";
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
        f = (ctx: IContext) => ctx.params[a.name];
        break;

      case PathDetailsType.QueryParam:
        f = (ctx: IContext) => ctx.query[a.name];
        break;

      case PathDetailsType.HeaderParam:
        f = (ctx: IContext) => ctx.req.headers[a.name.toLocaleLowerCase()];
        break;

      case PathDetailsType.CookieParam:
        f = (ctx: IContext) => ctx.cookies[a.name.toLocaleLowerCase()];
        break;

      case PathDetailsType.QueryString:
        f = (ctx: IContext) => ctx.querystring;
        break;

      case PathDetailsType.Request:
        f = (ctx: IContext) => ctx.req;
        break;

      case PathDetailsType.Response:
        f = (ctx: IContext) => ctx.res;
        break;

      case PathDetailsType.OriginalUrl:
        f = (ctx: IContext) => ctx.originalUrl;
        break;

      case PathDetailsType.UriInfo:
        f = (ctx: IContext) => ctx.UriInfo;
        break;

      case PathDetailsType.Headers:
        f = (ctx: IContext) => ctx.req.headers;
        break;

      case PathDetailsType.Context:
        f = (ctx: IContext) => ctx;
        break;

      case PathDetailsType.ContextScope:
        f = (ctx: IContext) => ctx.scope;
        break;

      case PathDetailsType.ContextScopeParam:
        f = (ctx: IContext) => ctx.scope[a.name];
        break;

      case PathDetailsType.RequestMethod:
        f = (ctx: IContext) => ctx.req.method;
        break;

      case PathDetailsType.RequestBody:
        f = (ctx: IContext) => ctx.parsedBody;
        break;

      case PathDetailsType.Query:
        f = (ctx: IContext) => ctx.query;
        break;

      default:
        f = () => void 0;
    }

    return f;

  });

  debug("Generated ExpectedArguments for %s.%s: %j", o.constructor.name, p, ret);

  return ret;

}
