import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";
import UserEntity, { UserRole } from "../../entity/user.entity";
import { deunionize } from "telegraf";

export default class AllModeratorsHears implements IHears {
  triggers = "👀 Просмотреть список модераторов";

  async exec(ctx: IContext) {
    if (ctx.session.user.role !== UserRole.ADMIN)
      return ctx.reply("Ошибка: недостаточно прав!");

    const userRepo = ctx.bot.db.getRepository(UserEntity);
    const moderators = await userRepo.find({
      where: { role: UserRole.MODERATOR },
    });

    let result =
      moderators.length > 0
        ? `Всего есть ${moderators.length} модераторов:\n`
        : "Модераторы отсутствуют";

    await Promise.all(
      moderators.map(async (moderator, i) => {
        const chat = deunionize(
          await ctx.telegram.getChat(moderator.telegramId)
        );
        const { username, first_name } = chat;
        const isUsername = !!username; // двойное отрицание, возвращает булево значение

        result +=
          `${i + 1}. ${isUsername ? username : first_name}\n` +
          `ID: ${moderator.telegramId}\n\n`;
      })
    );

    return ctx.reply(result);
  }
}
