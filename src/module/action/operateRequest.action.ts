import IAction from "../../interface/module/action/action.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize } from "telegraf";
import { UserRole } from "../../entity/user.entity";
import RequestEntity, { RequestStatus } from "../../entity/request.entity";

export default class OperateRequestAction implements IAction {
  triggers = /(acceptRequest|rejectRequest):.*/g;

  async exec(ctx: IContext) {
    await ctx.answerCbQuery();

    if (ctx.session.user.role !== UserRole.MODERATOR) {
      return ctx.reply("Ошибка: Недостаточно прав!");
    }

    const cbQuery = deunionize(ctx.callbackQuery);
    const data = cbQuery?.data;
    if (!data) return;

    const [operation, requestId] = data.split(":");

    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const request = await requestRepo.findOne(requestId);
    if (!request) return;

    const newStatus =
      operation === "acceptRequest"
        ? RequestStatus.ACCEPTED
        : RequestStatus.REJECTED;
    const newStatusMessage =
      operation === "acceptRequest" ? "Принята" : "Отклонена";

    request.status = newStatus;
    await requestRepo.save(request);

    ctx.bot.emit("requestStatusChange", newStatus);

    return ctx.reply(
      `Статус заявки #${requestId} успешно изменен на: ${newStatusMessage}`
    );
  }
}
