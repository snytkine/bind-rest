import { ParamExtractorFactory } from '../types/controllerparamextractor';
import Context from '../../components/context';
import { parseJsonBody } from '../utils';
import { IfIocContainer } from 'bind';
import {search} from 'jmespath'


export default function JMESPath(q: string): ParamExtractorFactory {

  try {
    search({}, q);
  } catch (e) {
    /**
     * This error is thrown during the startup phase
     * so if the user provides invalid jsonPath string
     * the application will fail to start. This is a good thing.
     */
    throw new Error(`Invalid JMESPath query. Error="${e.message}"`);
  }

  return (c: IfIocContainer) => (ctx: Context) => {
    return parseJsonBody(ctx.req).then(body => {
      try {
        return search(body, q);
      } catch(e){
        throw new Error(`JMESPath Failed to extract param from body. Error=${e.message}`)
      }
    })
  }
}
