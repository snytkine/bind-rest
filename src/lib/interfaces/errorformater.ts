import {IAppResponse} from "./appresponse";

export type FormatErrorFunc = (error: any) => IAppResponse

export interface IErrorFormatter {
  formatError: FormatErrorFunc
}
