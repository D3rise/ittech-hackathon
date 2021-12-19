import IMiddleware from "../../interface/module/middleware/middleware.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize, Markup } from "telegraf";

export default class EulaMiddleware implements IMiddleware {
  exec(ctx: IContext, next: () => any) {
    const errorText =
      "Ошибка: Сначала вам необходимо подтвердить согласие на обработку персональных данных!\n" +
      "Ссылка на соглашение: ";

    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Принять", "acceptEula"),
      Markup.button.callback("Отклонить", "rejectEula"),
    ]);

    const { user } = ctx.session;
    const cbQuery = deunionize(ctx.callbackQuery);
    if (cbQuery) {
      const { data } = cbQuery;
      console.log(data);
      if (data !== "acceptEula") return ctx.reply(errorText, inlineKeyboard);
      return next();
    }

    if (!user.eula) {
      return ctx.reply(errorText, inlineKeyboard);
    }
    return next();
  }
}
