import { Context } from "telegraf";
import { Scenes } from "telegraf";
import Bot from "../../bot";
import IState from "./state.interface";

export default interface IContext extends Context {
  state: IState;
  session: any;
  scene: Scenes.SceneContextScene<IContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<IContext>;
  bot: Bot;
}
