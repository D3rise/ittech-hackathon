import ICustomEvent from "../../interface/module/customEvent/customEvent.interface";
import Bot from "../../bot";
import IContext from "../../interface/context/context.interface";
import UserEntity from "../../entity/user.entity";
import { Markup } from "telegraf";

export default class RoleChangeEvent implements ICustomEvent {
  triggers = "roleChange";

  exec(bot: Bot, ctx: IContext, user: UserEntity, operation: boolean) {
    const { telegramId, role } = user;
    const buttons = bot.getMainMenu(role);

    return bot.telegraf.telegram.sendMessage(
      telegramId,
      `Ваша роль была ${
        operation
          ? "повышена до роли модератор"
          : "понижена до роли пользователь"
      }!`,
      Markup.keyboard(buttons).resize()
    );
  }
}
