import Context from '../lib/core/context';
import { Middleware } from '../lib/decorators/middleware';
import Router from './router';
import { Inject, Singleton } from 'bind';
import HTTPMethod from 'http-method-enum';
import { toHTTPMethod } from '../lib/core/apputils';
import { PRIORITY_ROUTER } from '../lib/consts';
import { NotFoundError } from '../lib/errors';

const debug = require('debug')('bind:rest:runtime');
const TAG = 'RouterMiddleware';

@Middleware(PRIORITY_ROUTER)
@Singleton
export default class RouterMiddleware {

  @Inject
  private router: Router;

  /**
   * Get controller and params from router
   * call controller, set response to context.appResponse
   *
   * @param context
   */
  doFilter(context: Context): Promise<Context> {

    const requestMethod = context.req.method;
    debug('%s entered filter with method="%s" url="%s"', TAG, requestMethod, context.requestUrl);

    const httpMethod: HTTPMethod = toHTTPMethod(context.req.method);
    debug('%s httpMethod="%s"', TAG, httpMethod);

    const routeMatch = this.router.getRouteMatch(httpMethod, context.requestUrl);
    if (!routeMatch) {
      debug('%s NO patch for method="%s" url="%s"', TAG, requestMethod, context.requestUrl);

      throw new NotFoundError(`
      Resource not found for method="${requestMethod}" 
      url="${context.requestUrl}"`,
      );

    } else {

      /**
       * Find controller from array of controllers
       */
      const ctrlContainer = routeMatch.node.controllers.find(ctrl => {
        return ctrl.matcher(context);
      });

      if (!ctrlContainer) {
        debug(
          '%s No matching ControllerContainer found for method="%s" url="%s"',
          TAG,
          requestMethod,
          context.requestUrl
        );

        throw new NotFoundError(`Controller not found for this request`);
      }

      context.routeParams = routeMatch.params;
      context.controllerName = ctrlContainer.id;

      return ctrlContainer.controller(context).then(response => {
        context.appResponse = response;

        return context;
      });

    }

  }

}
