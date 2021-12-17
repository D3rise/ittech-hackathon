import IBase from "../base.interface";

export default interface IHears extends IBase {
  triggers: string | string[] | RegExp;
}
