import { Context } from "telegraf";
import Bot from "../../bot";
import IState from "./state.interface";
import { SceneContextScene } from "telegraf/typings/scenes";

export default interface IContext extends Context {
  state: IState;
  session: any;
  scene: SceneContextScene<IContext>;
  bot: Bot;
}
