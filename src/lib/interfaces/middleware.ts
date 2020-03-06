/**
 * Created by snytkind on 12/4/16.
 */
import {IContext} from "./context";

export type MiddlewareFunc = (ctx: IContext) => Promise<IContext>



