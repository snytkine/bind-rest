/**
 * Created by snytkind on 4/10/17.
 */

export interface IControllerArg {
  path: string
  method: string
  [other: string]: any
}


export interface IRouteInfo<T extends IControllerArg, U> {
  routerPrefix: string
  requestUri?: string
  requestMethod?: string
  error?: string
  supportedMethods?: string
  controller?: {
    func: (arg: T) => U
    controllerName: string
    params: {
      [key: string]: string
    }
  }
}


export interface IRouterOptions<T extends IControllerArg, U> {
  prefix?: string
  errorController: (ctx: T, oErr?: IRouteInfo<T, U>) => U
  [other: string]: any
}


export interface IRouter<T, U> {

  addRoute(uri: string, method: string, ctrl: (ctx: T) => U, name: string): boolean
  route(ctx: T): U
  reset(): number

}

export interface IRouterConstructor<T extends IControllerArg, U> {
  new(options: IRouterOptions<T, U>): IRouter<T, U>
}
