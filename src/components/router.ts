import {HttpRouter} from 'holiday-router';
import {Component, Singleton, Inject} from 'bind';
import FrameworkController from '../lib/core/frameworkcontroller';
import { Middleware } from '../lib/decorators';
import { PRIORITY_ROUTER } from '../lib/consts';
import Context from './context';
import HTTPMethod from 'http-method-enum';
import { toHTTPMethod } from '../lib/core/apputils';
import { NotFoundError } from '../lib/errors';

const debug = require('debug')('bind:rest:runtime');
const TAG = 'RouterMiddleware';

/**
 * Decorate HttpRouter as @Component and @Singleton
 * @Component and @Singleton are functions that take
 * class as argument so we can simply apply these functions
 * to HttpRouter even though that class is from npm module
 */
Component(HttpRouter);
Singleton(HttpRouter);


@Middleware(PRIORITY_ROUTER)
@Singleton
class RouterMiddleware {

  @Inject
  private router: HttpRouter<FrameworkController>;

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
    const parsedUrl = context.parsedUrl;
    debug('%s parsedUrl="%o"', TAG, parsedUrl);
    const routeMatch = this.router.getRouteMatch(httpMethod, parsedUrl.pathname);
    if (!routeMatch) {
      debug('%s NO patch for method="%s" url="%s"', TAG, requestMethod, context.requestUrl);

      return Promise.reject(new NotFoundError(`
      Resource not found for method="${requestMethod}" 
      url="${context.requestUrl}"`,
      ));

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
          context.requestUrl,
        );

        return Promise.reject(new NotFoundError(`Controller not found for this request`));
      }

      context.routeParams = routeMatch.params;

      return ctrlContainer.controller(context).then(response => {
        context.appResponse = response;

        return context;
      });

    }

  }

}

/**
 * Now that HttpRouter is decorated as Component
 * Must export HttpRouter so that Component Loader will register
 * HttpRouter as a container component
 *
 */
export {HttpRouter, RouterMiddleware}

