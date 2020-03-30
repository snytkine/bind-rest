import { paramdecorator, AsyncParamValidator, ParamValidator } from '../../types';
import Context from '../../../components/context';
import { ValidationError } from '../../core';
import {
  IfIocContainer,
  Maybe,
  isDefined,
  getMethodParamName,
  ClassPrototype,
} from 'bind';
import { IControllerParamMeta } from '../../interfaces';
import { SYM_METHOD_PARAMS } from '../metaprops';

export function ValidateAsync(...validators: AsyncParamValidator[]): paramdecorator {

  return (target: ClassPrototype, propertyKey: string, index: number): void => {

    const controllerName = `${target.constructor.name}.${propertyKey}`;
    const paramName = getMethodParamName(target, propertyKey, index);
    /**
     * Generate single function from array of paramvalidator functions;
     */
    const validatorFunc: AsyncParamValidator = function paramValidator(container: IfIocContainer) {
      return function (ctx: Context) {
        return function (param: any): Maybe<Error> | Promise<Maybe<Error>> {
          const validationResults: Array<Maybe<Error> | Promise<Maybe<Error>>> = validators
            .map(f => f(container))
            .map(f => f(ctx))
            .map(param);

          const res = Promise.all(validationResults)
            .then((results: Array<Maybe<Error>>) => {

              return results.reduce((acc: string[], next: Maybe<Error>) => {
                if (isDefined(next)) {
                  acc.push(next.message);
                }
                return acc;
              }, []);

            }).then((errors: string[]) => {
              if (errors.length > 0) {
                return new ValidationError(`Validation failed for parameter "${paramName}"
                argument ${index}
                controller "${controllerName}"
                Errors: ${errors.join('\n')}
                `);
              }

              return undefined;
            })
            .catch(e => {
              return new ValidationError(`Validation error for parameter "${paramName}"
                argument ${index}
                controller "${controllerName}"
                Error: ${e.message}
                `);
            });
        };
      };
    };

    /**
     *  Array of objects of PathDetailsParam
     *  This array gets new element each time this function is run on
     *  the same method which is the case where multiple arguments of the method
     *  are annotated with @PathParam
     */
    let metaDetails: Array<IControllerParamMeta> = Reflect.getMetadata(SYM_METHOD_PARAMS,
      target,
      propertyKey) || [];

    if(!metaDetails[index]){
      metaDetails[index] = {
        f: undefined,
        isRequired: false,
        paramName: '',
        paramDecoratorType: undefined
      }
    }
    /**
     * metaDataDetails may already exist for this param if
     * any of the method param decorator or @Required decorator was already applied
     * this is fine as long as it does not already have .validator
     */
    if(metaDetails[index] && metaDetails[index].validator){
      throw new Error(`Method parameter validator for argument ${index} already defined 
      on method ${target.constructor?.name}.${propertyKey}`);
    }

    metaDetails[index].validator = validatorFunc;

    /**
     * Now set SYM_METHOD_PARAMS meta of this method with metaDetails value
     */
    Reflect.defineMetadata(SYM_METHOD_PARAMS, metaDetails, target, propertyKey);

  };
}
