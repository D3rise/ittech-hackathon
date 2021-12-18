import IContext from "../../interface/context/context.interface";
import ICommand from "../../interface/module/command/command.interface";
import { Markup } from "telegraf";

export default class StartCommand implements Pick<ICommand, "exec"> {
  exec(ctx: IContext) {
    return ctx.reply(
      "Что вы хотите сделать?",
      Markup.keyboard(["Отправить заявку на поступление"])
    );
  }
}
