import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";
import { Markup } from "telegraf";

export default class MenuHears implements IHears {
  triggers = "Вернуться в главное меню";

  exec(ctx: IContext) {
    return ctx.reply(
      "Что вы хотите сделать?",
      Markup.keyboard(["Отправить заявку на поступление"])
    );
  }
}
