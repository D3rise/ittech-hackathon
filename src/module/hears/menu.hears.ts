import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";
import { Markup } from "telegraf";

export default class MenuHears implements IHears {
  triggers = "Return to main menu";

  exec(ctx: IContext) {
    return ctx.reply(
      "What do you want to do?",
      Markup.keyboard(["Return to main menu"])
    );
  }
}
