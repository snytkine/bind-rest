import { Component, ComponentScope, Scope } from 'bind-di';
import { SERVER_REQUEST } from '../lib/consts';
import BindRestContext from './context';

@Component(SERVER_REQUEST)
@Scope(ComponentScope.REQUEST)
export default class RequestComponent {
  /**
   * When JavaScript constructor returns a value that value
   * will be returned as instance of constructed class
   * the result of calling new RequestComponent(context)
   * will be context.req
   * @param context this cannot be interface, must be concrete class or DI will not work because its unnamed injection.
   */
  constructor(context: BindRestContext) {
    return context.req;
  }
}
