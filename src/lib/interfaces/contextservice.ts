import {IContext} from "./context";

export interface IContextService {
  runService(ctx: IContext): Promise<any>
}
