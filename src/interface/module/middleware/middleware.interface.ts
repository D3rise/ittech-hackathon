import IBase from "../base.interface";
import IContext from "../../context/context.interface";
import { MiddlewareFn } from "telegraf";

export default interface IMiddleware extends IBase {
  exec: MiddlewareFn<IContext>;
}
