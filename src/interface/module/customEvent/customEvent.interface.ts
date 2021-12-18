import IBase from "../base.interface";

export default interface ICustomEvent extends IBase {
  triggers: string | symbol;
}
