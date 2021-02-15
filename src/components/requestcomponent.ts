import { Component, ComponentScope, Scope } from 'bind-di';
import { SERVER_REQUEST } from '../lib/consts';
import { IBindRestContext } from '../lib/interfaces';

@Component(SERVER_REQUEST)
@Scope(ComponentScope.REQUEST)
export default class RequestComponent {
  /**
   * When JavaScript constructor returns a value that value
   * will be returned as instance of constructed class
   * the result of calling new RequestComponent(context)
   * will be context.req
   * @param context
   */
  constructor(context: IBindRestContext) {
    return context.req;
  }
}
