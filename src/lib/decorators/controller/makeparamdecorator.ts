import { ParamExtractorFactory } from '../../types/controllerparamextractor';
import {Target} from 'bind';
import { PathDetailsType } from '../../enums';
import { applySingleAnnotation } from './noargmethodparams';

export default function makeParamDecorator(f: ParamExtractorFactory) {

  return function customParamDecorator(target: Target,
                   propertyKey: string,
                   parameterIndex: number) {

    return applySingleAnnotation(
      target,
      propertyKey,
      parameterIndex,
      false,
      PathDetailsType.CustomParamDecorator,
      f,
    );
  }
}
