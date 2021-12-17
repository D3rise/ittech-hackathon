import { Context } from "telegraf";
import Bot from "../../bot";
import IState from "./state.interface";

export default interface IContext extends Context {
  state: IState;
  bot: Bot;
}
