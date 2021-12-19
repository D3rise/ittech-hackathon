import ICustomEvent from "../../interface/module/customEvent/customEvent.interface";
import Bot from "../../bot";
import RequestEntity, { RequestStatus } from "../../entity/request.entity";
import { Markup } from "telegraf";

export default class RequestStatusChangeEvent implements ICustomEvent {
  triggers = "requestStatusChange";

  async exec(
    bot: Bot,
    newStatus: RequestStatus,
    requestId: number
  ): Promise<any> {
    const requestRepo = bot.db.getRepository(RequestEntity);
    const request = await requestRepo.findOne(requestId, {
      relations: ["author", "pendingDocuments"],
    });
    if (!request) return;

    const { author } = request;

    switch (newStatus) {
      case RequestStatus.DOCS_PENDING:
        const pendingDocument = request.pendingDocuments.at(-1);
        if (!pendingDocument) return;

        return bot.telegraf.telegram.sendMessage(
          author.telegramId,
          `Статус вашей заявки под номером ${request.id} изменился!\n` +
            `Новый статус: Ожидает документа\n` +
            `Название документа: ${pendingDocument.name}\n` +
            `Описание документа: ${
              pendingDocument.description ?? "Отсутствует"
            }\n` +
            `Всего требуется документов: ${request.pendingDocuments.length}`,

          Markup.inlineKeyboard([
            Markup.button.callback(
              "Просмотреть заявку",
              `showRequest:${request.id}`
            ),
          ])
        );

      case RequestStatus.REJECTED:
        return bot.telegraf.telegram.sendMessage(
          author.telegramId,
          `К сожалению, вашу заявку #${request.id} отклонили.\n`
        );
      case RequestStatus.ACCEPTED:
        return bot.telegraf.telegram.sendMessage(
          author.telegramId,
          `🎉 Поздравляем! Вашу заявку на поступление под номером ${request.id} приняли!`
        );
    }
  }
}
