import "reflect-metadata";
import {
    SYM_METHOD_PARAMS,
    SYM_REQUEST_METHOD,
    SYM_REQUEST_PATH, SYM_COMPONENT_TYPE, PARAM_TYPES, SYM_JSON_SCHEMA, SYM_CONTROLLER_MIDDLEWARES,
    CONTROLLER_MIDDLEWARE_METHOD
} from '../decorators/metaprops';
import {
    ControllerDetails,
    ControllerFunc,
    MiddlewareFunc,
    IAppResponse,
    IContext,
    IBodyParserOptions,
    ParsedBodyType
} from '../interfaces';
import {RequestMethod} from '../enums/requestmethods';
import {controllerArgumentsFactory, paramsValidatorFactory, RequestBodyParserMiddleware} from '../routermiddleware';
import {paramsMapGenerator} from './apputils/paramsmapgenerator'
import {ClassMethod} from "../types/controllers";
import {PathDetailsParam} from "../interfaces/pathdetailsparams";
import {PathDetailsType, ComponentType} from "../enums";
import Container from './container';
import {getDependencies} from "../decorators/container/utils";

const debug = require('debug')('promiseoft:runtime:controller');
const TAG = "ControllerParser";
const joinPath = (base: string = "", callPath: string = "") => base + callPath;

/**
 * @todo if we add @Consumes annotations that we will also know expected content-type
 * and can add it to this IBodyParserOptions
 * @todo should also get MAX_BODY_LENGTH for limit option
 */
export class RequestBodyClassMeta implements IBodyParserOptions {

    readonly parsedBodyType: ParsedBodyType;

    constructor(public readonly proto: any, public readonly schema: any = null) {
        this.parsedBodyType = ParsedBodyType.TO_JSON
    }

}


export class RequestTextBodyClassMeta implements IBodyParserOptions {

    readonly parsedBodyType: ParsedBodyType;

    constructor() {
        this.parsedBodyType = ParsedBodyType.TO_TEXT
    }

}

const needsBodyParser = function (cm: ClassMethod): IBodyParserOptions | undefined {
    const [o, p] = cm;
    let classPrototype = null;
    let jsonSchema: any = null;
    let methodArg: PathDetailsParam;

    const paramsMeta: Array<PathDetailsParam> = Reflect.getMetadata(SYM_METHOD_PARAMS, o, p);
    const paramTypes = Reflect.getMetadata(PARAM_TYPES, o, p);

    if (paramsMeta && paramsMeta.length > 0) {
        methodArg = paramsMeta.find(param => param && param.type === PathDetailsType.RequestBody);
    }

    if (methodArg) {


        if (paramTypes[methodArg.position]) {
            debug("TYPE OF REQUESTBODY arg: ", (typeof paramTypes[methodArg.position])); //Function: Number for :number,  Function: String for :string

            if ((typeof paramTypes[methodArg.position] === 'function' ) &&
                paramTypes[methodArg.position].prototype &&
                paramTypes[methodArg.position].prototype.constructor) {

                /**
                 * First check in the type of RequestBody argument is string
                 * then we need to parse it to a string
                 */
                if (paramTypes[methodArg.position].prototype.constructor.name === 'String') {
                    debug("REQUEST BODY TYPE is String object");

                    return new RequestTextBodyClassMeta();
                }

                classPrototype = paramTypes[methodArg.position].prototype;
                jsonSchema = Reflect.getMetadata(SYM_JSON_SCHEMA, paramTypes[methodArg.position].prototype.constructor) || null;

            }
        }

        /**
         * paramType is not known for RequestBody. In this case
         * its the same as type:any and will be parsed into json
         * @todo
         * in the future can deduct the desired type from request headers
         */
        return new RequestBodyClassMeta(classPrototype, jsonSchema);

    } else {
        return void 0;
    }


};

/**
 * @param controllerClass annotated controller class
 * @return array of objects {routeName:string, method:RequestMethod, route:string, controllerFunc:ControllerFunc} | empty array IF passed object is not an annocatedController
 *
 */
export function parseController(controllerClass): Array<ControllerDetails> {

    const o = controllerClass.prototype;
    debug(`Entered parseController for class ${o.constructor.name}`);
    const props = Object.getOwnPropertyNames(o);
    const aCtrlMiddlewares = Reflect.getMetadata(SYM_CONTROLLER_MIDDLEWARES, controllerClass) || []; // calling this on controllerClass.prototype does not work


    let compType = Reflect.getMetadata(SYM_COMPONENT_TYPE, o.constructor);
    if (!compType || compType !== ComponentType.CONTROLLER) {
        debug(`${o.constructor.name} IS NOT a Controller`);
        return [];
    }

    const basePath = Reflect.getMetadata(SYM_REQUEST_PATH, o.constructor) || "";
    debug(`basePath for ${o.constructor.name}: ${basePath}`);

    return props.map(p => {
        let ctrl: ControllerFunc;
        const metaMethods: Array<RequestMethod> = Reflect.getMetadata(SYM_REQUEST_METHOD, o, p);
        const metaPath = Reflect.getMetadata(SYM_REQUEST_PATH, o, p);
        const paramsMeta = Reflect.getMetadata(SYM_METHOD_PARAMS, o, p);
        const controllerName = `${o.constructor.name}.${p}`;
        let aMiddlewares = Reflect.getMetadata(SYM_CONTROLLER_MIDDLEWARES, o, p) || [];
        aMiddlewares = aCtrlMiddlewares.concat(aMiddlewares);

        debug(`method ${controllerName} requestMethod = ${ metaMethods && JSON.stringify(metaMethods.map(_ => RequestMethod[_]))}, path = ${metaPath} paramsMeta = ${JSON.stringify(paramsMeta)}`);

        if (!metaMethods) {
            debug(`Method ${controllerName} is NOT a controller`);
            return void 0;
        }

        const paramsMap = paramsMapGenerator([o, p]);
        const paramsGenerator = controllerArgumentsFactory(paramsMap);
        /**
         *
         * If have @RequestBody param then add bodyParser context transformer
         * @todo If have @SubmittedForm or @FormParam then add form parser transformer
         * Later will add GroupAuth and CustomAuth transformers.
         */
        const paramsValidator = paramsValidatorFactory([o, p]);

        let aControllerMiddlewares: Array<MiddlewareFunc> = [paramsGenerator];

        aControllerMiddlewares.push(paramsValidator);


        /**
         * If method has @RequestBody annotation then add the jsonbody MiddlewareFunc
         * as the first transformer. It must be before the paramsGenerator transformer
         * @todo Check the @Consumes annotation of this method. It may include array of supported content-types
         *
         *
         * @todo in the future we will have more general bodyparser transformer with will decode
         * body based on request's content-type header and matched agains @Consumes annotation
         *
         * For now we parse body as json
         *
         *
         * @param ctx
         * @returns void
         */
        const bodyParserOptions: IBodyParserOptions = needsBodyParser([o, p]);
        if (bodyParserOptions) {
            debug(`${TAG} method ${controllerName} needs bodyParser. bodyParserOptions: `, bodyParserOptions);

            /**
             * @todo pass some options based on values from settings better from some env based constants
             * for example max json size, encoding, and in the future maybe can pass
             * custom reviver function based on type of RequestBody
             * @type {RequestBodyParserMiddleware}
             */

            /**
             * @todo
             * In the future can check against external route definition if
             * route has schema for input body then can add schema to parserOptions
             * then parser will also do schema validation.
             */
            const bodyParser = new RequestBodyParserMiddleware(bodyParserOptions);

            aControllerMiddlewares.unshift(ctx => {
                return bodyParser.parseBody(ctx);
            })
        }

        /**
         * If Controller has any @Middlewares they must be added before bodyParser
         * meaning to add controller middleware functions before the first middleware of aControllerMiddlewares
         * and in the same order as they were entered into @Middlewares(...) decorator
         */
        if (aMiddlewares.length > 0) {
            debug(`${TAG} adding controller specific middlewares for '${controllerName}'`);
            aControllerMiddlewares = aMiddlewares.map(mw => {
                return (ctx: IContext) => Container.getComponent(mw, ctx).doFilter(ctx)
            }).concat(aControllerMiddlewares);
        }


        const aDeps = getDependencies(controllerClass);
        /**
         * We could have added aDeps.length check in one place and don't split this
         * into 2 condition branches but that would require to have that check run at run time
         * at every controller call.
         * Doing it this way we will not check aDeps.length at run time
         */
        if (aDeps.length > 0) {
            ctrl = (ctx: IContext): Promise<IAppResponse> => {
                debug("%s setting controllerName property of Context Object to %s", TAG, controllerName);
                ctx.controllerName = controllerName;

                let oCtrl = new controllerClass();
                oCtrl = Container.setDependencies(oCtrl, ctx, aDeps);
                debug("Calling Controller %s with args: %j", controllerName, ctx.controllerArguments);
                return oCtrl[p](...ctx.controllerArguments);
            };
        } else {
            debug("%s Making no-deps controller Function", TAG);

            ctrl = (ctx: IContext): Promise<IAppResponse> => {
                debug("_setting_ controllerName property of Context Object to %s", controllerName);
                ctx.controllerName = controllerName;
                const oCtrl = new controllerClass();
                debug("%s Calling Controller %s with args: %j", TAG, controllerName, ctx.controllerArguments);
                return oCtrl[p](...ctx.controllerArguments);
            };
        }

        return {
            name: controllerName,
            requestMethods: metaMethods,
            routePath: joinPath(basePath, metaPath),

            ctrl: (ctx: IContext) => {
                return aControllerMiddlewares.reduce((prev, cur) => prev.then(cur), Promise.resolve(ctx)).then(ctrl)
            }
        }

    }).filter(_ => !!(_)); // filter is important because some method of obj are undefined if method is not a controller

}
