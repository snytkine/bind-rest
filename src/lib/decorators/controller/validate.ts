import { IfIocContainer, Maybe, isDefined, getMethodParamName, ClassPrototype } from 'bind';
import {
  IParamDecorator,
  AsyncValidator,
  AsyncParamValidator,
  AsyncContextParamValidator,
  ParamValidator,
} from '../../types';
import Context from '../../../components/context';
import { IControllerParamMeta } from '../../interfaces';
import { SYM_METHOD_PARAMS } from '../metaprops';
import { DOTTED_LINE } from '../../consts';

/**
 * Take validator function and turn it into AsyncValidator function
 * The new function will not use container and context but will satisfy
 * the AsyncValidator signature and can be used anywhere the AsyncValidator is expected.
 * @param validator
 */
const toAsyncValidator = (validator: ParamValidator): AsyncValidator => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (c: IfIocContainer) => (ctx: Context) => validator;
};

export function ValidateAsync(...validators: AsyncValidator[]): IParamDecorator {
  return (target: ClassPrototype, propertyKey: string, index: number): void => {
    const paramName = getMethodParamName(target, propertyKey, index);
    /**
     * Generate single function from array of paramvalidator functions;
     */
    const validatorFunc: AsyncValidator = function paramValidator(container: IfIocContainer) {
      return function paramValidator2(ctx: Context) {
        return function paramValidator3(param: any): Promise<Maybe<Error>> {
          const validationResults: Array<Maybe<Error> | Promise<Maybe<Error>>> = validators
            .map((f: AsyncValidator) => f(container))
            .map((f: AsyncContextParamValidator) => f(ctx))
            .map((f: AsyncParamValidator) => f(param));

          return Promise.all(validationResults)
            .then((results: Array<Maybe<Error>>) => {
              return results.reduce((acc: string[], next: Maybe<Error>) => {
                if (isDefined(next)) {
                  acc.push(next.message);
                }
                return acc;
              }, []);
            })
            .then((errors: string[]) => {
              if (errors.length > 0) {
                return new Error(`Parameter "${paramName}" (argument ${index})
                Errors:\n${errors.join(DOTTED_LINE)}
                `);
              }

              return undefined;
            })
            .catch((e) => {
              return new Error(`Parameter "${paramName}" (argument ${index})
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
    const metaDetails: Array<IControllerParamMeta> =
      Reflect.getMetadata(SYM_METHOD_PARAMS, target, propertyKey) || [];

    if (!metaDetails[index]) {
      metaDetails[index] = {
        f: undefined,
        isRequired: false,
        paramName: '',
        paramDecoratorType: undefined,
      };
    }
    /**
     * metaDataDetails may already exist for this param if
     * any of the method param decorator or @Required decorator was already applied
     * this is fine as long as it does not already have .validator
     */
    if (metaDetails[index] && metaDetails[index].validator) {
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

export function Validate(...validators: Array<ParamValidator>): IParamDecorator {
  const asyncValidators = validators.map(toAsyncValidator);

  return ValidateAsync(...asyncValidators);
}
