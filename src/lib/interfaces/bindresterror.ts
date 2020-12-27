import ERROR_TYPE from '../consts/bindresterror';
import { ErrorType } from '../enums';

export interface IBindRestError {
  [ERROR_TYPE]: ErrorType;
}
