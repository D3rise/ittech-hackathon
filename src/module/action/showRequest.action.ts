import IAction from "../../interface/module/action/action.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize, Markup } from "telegraf";
import RequestEntity, { RequestStatus } from "../../entity/request.entity";
import { UserRole } from "../../entity/user.entity";

export default class ShowRequestAction implements IAction {
  triggers = /showRequest:.*/g;

  async exec(ctx: IContext) {
    await ctx.answerCbQuery();

    const cbQuery = deunionize(ctx.callbackQuery);
    if (!cbQuery) return;

    const { data } = cbQuery;
    if (!data) return;

    const operation = data.split(":").at(1);
    const requestId = data.split(":").at(-1);
    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const request = await requestRepo.findOne(requestId, {
      relations: ["author", "pendingDocuments", "documents"],
    });
    if (!request) return;

    const { author, documents, pendingDocuments } = request;

    if (operation === "pendingDocuments") {
      await ctx.reply(
        `Требуемые документы для запроса #${requestId}: ${
          pendingDocuments.length > 0 ? pendingDocuments.length : "Отсутствуют"
        }`
      );

      for (const [i, doc] of pendingDocuments.entries()) {
        let message = `${i + 1}. ${doc.name} - ${
          doc.description ?? "Описание отсутствует"
        }`;
        let inlineKeyboardButtons = [];

        if (String(ctx.from?.id) === request.author.telegramId) {
          inlineKeyboardButtons.push(
            Markup.button.callback(
              "Прикрепить документ",
              `attachPendingDocument:${doc.id}`
            )
          );
        }

        const inlineKeyboard = Markup.inlineKeyboard(inlineKeyboardButtons);
        await ctx.reply(message, inlineKeyboard);
      }
    }

    let status;
    switch (request.status) {
      case RequestStatus.ACCEPTED:
        status = "Принята";
        break;
      case RequestStatus.REJECTED:
        status = "Отклонена";
        break;
      case RequestStatus.PROCESSING:
        status = "В очереди на обработку";
        break;
      case RequestStatus.DOCS_PENDING:
        status = "Требуются документы";
        break;
      default:
        status = "Неопределен";
    }

    const message =
      `Заявка #${requestId}:\n` +
      `Автор: ${request.name} ${request.surname} ${request.middlename}\n` +
      `Номер телефона: ${request.telephone}\n` +
      `Текущий статус: ${status}\n` +
      `Требуются документы: ${pendingDocuments.length ?? "Не требуются"}\n` +
      `Прикрепленные документы: ${documents.length ?? "Отсутствуют"}`;

    const inlineKeyboardButtons = [
      Markup.button.callback(
        "Скачать документы",
        `downloadDocuments:${requestId}`
      ),
      Markup.button.callback(
        "Просмотреть треб. док.",
        `showRequest:pendingDocuments:${requestId}`
      ),
    ];

    switch (ctx.session.user.role) {
      case UserRole.MODERATOR:
        inlineKeyboardButtons.push(
          Markup.button.callback("Принять", `acceptRequest:${requestId}`),
          Markup.button.callback("Отклонить", `rejectRequest:${requestId}`),
          Markup.button.callback(
            "Запросить документ",
            `requestDocument:${requestId}`
          )
        );
        break;
      case UserRole.ADMIN:
      case UserRole.USER:
        inlineKeyboardButtons.push(
          Markup.button.callback("Удалить", `deleteRequest:${requestId}`)
        );
        break;
    }
    const inlineKeyboard = Markup.inlineKeyboard(inlineKeyboardButtons);

    return ctx.reply(message, inlineKeyboard);
  }
}
