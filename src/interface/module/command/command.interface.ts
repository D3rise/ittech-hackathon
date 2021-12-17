import IArgument from "./argument.interface";
import IBase from "../base.interface";

export default interface ICommand extends IBase {
  name: string | string[];
  description: string;
  args: IArgument[];
}
