import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";

export default class MenuHears implements IHears {
  triggers = "Вернуться в главное меню";

  exec(ctx: IContext) {
    return ctx.bot.mainMenu(ctx);
  }
}
