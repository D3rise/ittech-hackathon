import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";
import RequestEntity, { RequestStatus } from "../../entity/request.entity";
import { deunionize, Markup } from "telegraf";
import { FindManyOptions } from "typeorm";

export default class AllRequestHears implements IHears {
  triggers = [
    "Просмотреть все заявки",
    "Просмотреть необработанные заявки",
    "Просмотреть уже обработанные заявки",
  ];

  async exec(ctx: IContext) {
    const text = deunionize(ctx.message)?.text;
    if (!text) return;

    let findOptions: FindManyOptions<RequestEntity>;

    switch (text) {
      case "Просмотреть необработанные заявки":
        findOptions = {
          where: [
            {
              status: RequestStatus.DOCS_PENDING,
            },
            {
              status: RequestStatus.PROCESSING,
            },
          ],
        };
        break;
      case "Просмотреть уже обработанные заявки":
        findOptions = {
          where: [
            {
              status: RequestStatus.ACCEPTED,
            },
            {
              status: RequestStatus.REJECTED,
            },
          ],
        };
        break;
      default:
        findOptions = {};
    }

    const requestRepository = ctx.bot.db.getRepository(RequestEntity);
    const requests = await requestRepository.find(findOptions);
    if (requests.length === 0) {
      return ctx.reply(
        text === "Все заявки"
          ? "Заявок нет!"
          : "Заявок с такими параметрами не найдено!"
      );
    }

    for (const request of requests) {
      await ctx.replyWithHTML(
        `<b>Заявка #${request.id}</b>\n` +
          `<b>Фамилия</b>: ${request.surname}\n` +
          `<b>Имя</b>: ${request.name}\n` +
          `<b>Отчество</b>: ${request.middlename}\n` +
          `<b>Номер телефона</b>: ${request.telephone}`,
        Markup.inlineKeyboard([
          Markup.button.callback(
            "Просмотреть заявку",
            `showRequest:${request.id}`
          ),
        ])
      );
    }
  }
}
