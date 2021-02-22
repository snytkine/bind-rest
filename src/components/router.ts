import {HttpRouter} from 'holiday-router';
import {Component, Singleton, Inject} from 'bind-di';
import HTTPMethod from 'http-method-enum';
import FrameworkController from '../lib/core/frameworkcontroller';
import {decorateMiddleware} from '../lib/decorators';
import {PRIORITY_ROUTER} from '../lib/consts';
import {toHTTPMethod} from '../lib/utils';
import {NotFoundError} from '../lib/errors';
import {IBindRestContext} from '../lib';

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

//@Middleware(PRIORITY_ROUTER)
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
  doFilter(context: IBindRestContext): Promise<IBindRestContext> {
    const {requestMethod} = context;
    const {path} = context;
    debug(
      '%s entered filter with contextType=%s method="%s" url="%s"',
      TAG,
      context.contextType,
      requestMethod,
      context.path,
    );

    const httpMethod: HTTPMethod = toHTTPMethod(requestMethod);
    debug('%s httpMethod="%s"', TAG, httpMethod);

    debug('%s path="%o"', TAG, path);
    const routeMatch = this.router.getRouteMatch(httpMethod, path);
    if (!routeMatch) {
      debug('%s NO match for method="%s" url="%s"', TAG, requestMethod, path);

      return Promise.reject(
        new NotFoundError(`
      Resource not found for method="${requestMethod}" 
      url="${context.requestUrl}"`),
      );
    }

    /**
     * Find controller from array of controllers
     */
    const ctrlContainer = routeMatch.node.controllers.find((ctrl) => {
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

    Reflect.set(context, 'routeParams', routeMatch?.params);

    return ctrlContainer.controller(context).then((response) => {
      debug('%s got appResponse %o', TAG, response);
      Reflect.set(context, 'appResponse', response);

      return context;
    });
  }
}

decorateMiddleware(RouterMiddleware, PRIORITY_ROUTER, 'RouterMiddleware')
/**
 * Now that HttpRouter is decorated as Component
 * Must export HttpRouter so that Component Loader will register
 * HttpRouter as a container component
 *
 */
export {HttpRouter, RouterMiddleware};
