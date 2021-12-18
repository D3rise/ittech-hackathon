import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";
import { Markup } from "telegraf";
import RequestEntity from "../../entity/request.entity";

export default class AllRequestHears implements IHears {
  triggers = "Все заявки";

  async exec(ctx: IContext) {
    const requestRepository = ctx.bot.db.getRepository(RequestEntity);
    const requests = await requestRepository.find();
    return Promise.all(requests.map(request => {
      return ctx.replyWithHTML(`
        <div>Фамилия ${request.surname}</div>
        <div>Имя ${request.name}</div> 
        <div>Отчество ${request.middlename}</div>
        <div>Номер телефона ${request.telephone}</div>
      `)
    }));
  }
}
