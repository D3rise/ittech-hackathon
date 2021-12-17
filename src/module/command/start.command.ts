import IContext from "../../interface/context/context.interface";
import ICommand from "../../interface/module/command/command.interface";
import { Markup } from "telegraf";

export default class StartCommand implements Pick<ICommand, "exec"> {
  exec(ctx: IContext) {
    ctx.reply(
      "Choose something idk:",
      Markup.inlineKeyboard([Markup.button.callback("HELLO THERE", "hello")])
    );
  }
}
