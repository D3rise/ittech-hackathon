import IContext from "../../interface/context/context.interface";
import ICommand from "../../interface/module/command/command.interface";
import { Markup } from "telegraf";

export default class StartCommand implements Pick<ICommand, "exec"> {
  exec(ctx: IContext) {
    return ctx.reply(
      "What do you want to do?",
      Markup.keyboard(["Return to main menu"])
    );
  }
}