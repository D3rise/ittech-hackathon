import IAction from "../../interface/module/action/action.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize } from "telegraf";
import RequestEntity from "../../entity/request.entity";
import { UserRole } from "../../entity/user.entity";

export default class DeleteRequestAction implements IAction {
  triggers = /deleteRequest:.*/g;

  async exec(ctx: IContext) {
    await ctx.answerCbQuery();

    const cbQuery = deunionize(ctx.callbackQuery);
    const data = cbQuery?.data;
    if (!data) return;

    const requestId = data.split(":").at(-1);
    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const request = await requestRepo.findOne(requestId, {
      relations: ["author"],
    });
    if (!request) return;

    if (
      String(cbQuery.from.id) !== request.author.telegramId &&
      ctx.session.user.role !== UserRole.ADMIN
    ) {
      return ctx.reply("Ошибка: Недостаточно прав!");
    }

    await requestRepo.softRemove(request);
    return ctx.reply("Запрос был успешно удален!");
  }
}
