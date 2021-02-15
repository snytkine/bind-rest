import { IfIocContainer } from 'bind-di';
import { search } from 'jmespath';
import { ParamExtractorFactory } from '../types/controllerparamextractor';
import { parseJsonBody } from './parsebody';
import ApplicationError from '../errors/applicationerror';
import { IBindRestContext } from '../interfaces';

export default function JMESPath(q: string): ParamExtractorFactory {
  try {
    search({}, q);
  } catch (e) {
    /**
     * This error is thrown during the startup phase
     * so if the user provides invalid jsonPath string
     * the application will fail to start. This is a good thing.
     */
    throw new ApplicationError(`Invalid JMESPath query. Error="${e.message}"`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (c: IfIocContainer) => (ctx: IBindRestContext) => {
    return parseJsonBody(ctx).then((body) => {
      try {
        return search(body, q);
      } catch (e) {
        throw new ApplicationError(
          `JMESPath Failed to extract param from body. Error=${e.message}`,
        );
      }
    });
  };
}
