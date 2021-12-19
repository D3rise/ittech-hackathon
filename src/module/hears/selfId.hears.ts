import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";

export default class SelfIdHears implements IHears {
  triggers = "👓 Просмотреть свой ID";

  exec(ctx: IContext) {
    const { from } = ctx;
    if (!from) return;

    return ctx.reply(`Ваш ID: ${from.id}`);
  }
}
