import { SERVER_RESPONSE } from '../lib/consts';
import { Component, ComponentScope, Scope } from 'bind';
import Context from './context';

@Component(SERVER_RESPONSE)
@Scope(ComponentScope.REQUEST)
export default class RequestComponent {

  /**
   * When JavaScript constructor returns a value that value
   * will be returned as instance of constructed class
   * the result of calling new RequestComponent(context)
   * will be context.res
   * @param context
   */
  constructor(context: Context) {
    return context.res;
  }
}
