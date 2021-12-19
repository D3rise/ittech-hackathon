import IAction from "../../interface/module/action/action.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize, Markup } from "telegraf";
import UserEntity from "../../entity/user.entity";

export default class EulaAction implements IAction {
  triggers = ["acceptEula", "rejectEula"];

  async exec(ctx: IContext) {
    await ctx.answerCbQuery();
    if (ctx.session.user.eula) return;

    const cbQuery = deunionize(ctx.callbackQuery);
    const data = cbQuery?.data;
    if (!data) return;

    const userRepo = ctx.bot.db.getRepository(UserEntity);

    let message;
    switch (data) {
      case "acceptEula":
        message =
          "Вы успешно подтвердили согласие на обработку персональных данных!";
        ctx.session.user.eula = true;
        await userRepo.save(ctx.session.user);
        await ctx.reply(message);
        return ctx.bot.mainMenu(ctx);
      case "rejectEula":
        message =
          "Вы не сможете использовать бота до тех пор, пока не подтвердите согласие на обработку персональных данных.\n" +
          "Ссылка на соглашение: https://franko.su/data/files/soglash.docx";
        const inlineKeyboard = Markup.inlineKeyboard([
          Markup.button.callback("Принять", "acceptEula"),
          Markup.button.callback("Отклонить", "rejectEula"),
        ]);

        return ctx.reply(message, inlineKeyboard);
    }
  }
}
