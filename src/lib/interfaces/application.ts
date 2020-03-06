import {AppErrorHandlerFunc} from "./apperrorhandler";

export interface ApplicationOptions {
  baseDir: string
  timeout?:number
  baseUrl?:string
  extraComponents?: Array<any>
}