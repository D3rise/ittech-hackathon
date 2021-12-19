import IMiddleware from "../../interface/module/middleware/middleware.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize, Markup } from "telegraf";

export default class EulaMiddleware implements IMiddleware {
  exec(ctx: IContext, next: () => any) {
    if (ctx.updateType === "my_chat_member") return next();

    const errorText =
      "Ошибка: Сначала вам необходимо подтвердить согласие на обработку персональных данных!\n" +
      "Ссылка на соглашение: https://franko.su/data/files/soglash.docx";

    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Принять", "acceptEula"),
      Markup.button.callback("Отклонить", "rejectEula"),
    ]);

    const { user } = ctx.session;

    const cbQuery = deunionize(ctx.callbackQuery);
    if (cbQuery) {
      const { data } = cbQuery;

      if (
        data !== "acceptEula" &&
        data !== "rejectEula" &&
        user.eula === false
      ) {
        return ctx.reply(errorText, inlineKeyboard).catch(console.log);
      }

      return next();
    }

    if (user.eula === false) {
      return ctx.reply(errorText, inlineKeyboard).catch(console.log);
    }

    return next();
  }
}
