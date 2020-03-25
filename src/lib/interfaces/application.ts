import {AppErrorHandlerFunc} from "./apperrorhandler";

export interface ApplicationOptions {
  componentDirs: string[]
  timeout?:number
  baseUrl?:string
  extraComponents?: Array<any>
}
