/**
 * Created by snytkind on 11/24/16.
 */

export const CONTROLLER_MIDDLEWARE_METHOD = 'doFilter';
export const CONTEXT_SERVICE_METHOD = 'runService';
export const SYM_METHOD_PARAMS = Symbol.for('method-params');
export const SYM_REQUEST_METHOD = Symbol.for('http-request-method');
export const SYM_REQUEST_PATH = Symbol.for('request-path');
export const DESIGN_TYPE = 'design:type';
export const RETURN_TYPE = 'design:returntype';
export const PARAM_TYPES = 'design:paramtypes';
export const SYM_MIDDLEWARE_PRIORITY = Symbol.for('middleware:priority');
export const SYM_MIDDLEWARE_NAME = Symbol.for('middleware:name');
//export const SYM_COMPONENT_TYPE = Symbol.for("component:type");
//export const SYM_COMPONENT_DEPENDENCIES = Symbol.for("component:dependencies");
//export const SYM_COMPONENT_NAME = Symbol.for("component:name");
export const SYM_COMPONENT_FACTORY_METHODS = Symbol.for('componentfactory:methods');
export const SYM_COMPONENT_ENVIRONMENTS = Symbol.for('component:environment');
//export const SYM_INIT_METHOD = Symbol.for("component:init");
export const SYM_INIT_ORDER = Symbol.for('component:init_order');
//export const SYM_DESTRUCTOR_METHOD = Symbol.for("component:destruct");
export const SYM_JSON_SCHEMA = Symbol.for('document:json:schema');
export const SYM_CONTROLLER_MIDDLEWARES = Symbol.for('controller:middlelwares');
//
export const IS_CONTROLLER = 'IS_CONTROLLER';
export const IS_MIDDLEWARE = 'IS_MIDDLEWARE';
export const MIDDLEWARE_PRIORITY = 'MIDDLEWARE_PRIORITY';
export const IS_ERROR_HANDLER = 'IS_ERROR_HANDLER';
