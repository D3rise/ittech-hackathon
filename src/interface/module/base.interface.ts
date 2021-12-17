import IContext from "../context/context.interface";

export default interface IBase {
  exec(ctx: IContext, next?: () => Promise<any>): any | Promise<any>;
}
