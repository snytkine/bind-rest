import { IfIocContainer } from 'bind-di';
import { parse, value } from 'jsonpath';
import { ParamExtractorFactory } from '../types/controllerparamextractor';
import { parseJsonBody } from './parsebody';
import { IBindRestContext } from '../interfaces/icontext';

export default function JSONPath(q: string): ParamExtractorFactory {
  try {
    parse(q);
  } catch (e) {
    /**
     * This error is thrown during the startup phase
     * so if the user provides invalid jsonPath string
     * the application will fail to start. This is a good thing.
     */
    throw new Error(`Invalid JSONPath query. Error="${e.toString()}"`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (c: IfIocContainer) => (ctx: IBindRestContext) => {
    return parseJsonBody(ctx).then((body) => {
      try {
        return value(body, q);
      } catch (e) {
        throw new Error(`JSONPath Failed to extract param from body. Error=${e.message}`);
      }
    });
  };
}
