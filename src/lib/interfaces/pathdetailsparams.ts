import {PathDetailsType} from "../enums/pathdetails";
import {StringOrSymbol} from 'bind';
/**
 * Created by snytkind on 12/29/16.
 */



export interface PathDetailsParam {
  type: PathDetailsType;
  /**
   * name of parameter.
   * This will be named path param or named query param
   * Wrapper function generator sets the name to value passed in @PathParam() annotation
   */
  name: string;
  /**
   * value may not exist in object extracted from annotations. (some annotations may have it, some may not)
   * it will exist when param is mapped to a value from request.
   */
  value?: any;
  /**
   * Optional position in origin method declaration
   */
  position?: number;

  /**
   * If set to true indicates that
   * argument value is required
   * ParamsValidator will throw error
   * if required param is not passed in request
   */
  required?:boolean
}

