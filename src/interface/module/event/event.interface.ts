import IBase from "../base.interface";
import { MessageSubType, UpdateType } from "telegraf/typings/telegram-types";

type MaybeArray<T> = T | T[];

export default interface IEvent extends IBase {
  triggers: MaybeArray<UpdateType | MessageSubType>;
}
