import IBase from "../base.interface";

export default interface IAction extends IBase {
  triggers: string | string[] | RegExp | RegExp[];
  dependsOn?: IAction[];
}
