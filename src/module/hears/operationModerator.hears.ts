import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize } from "telegraf";
import { UserRole } from "../../entity/user.entity";

export default class OperationModeratorHears implements IHears {
  triggers = ["➕ Добавить модератора", "➖ Удалить модератора"];

  async exec(ctx: IContext) {
    const text = deunionize(ctx.message)?.text;
    if (!text) return;
    if (ctx.session.user.role !== UserRole.ADMIN) {
      return ctx.reply("Ошибка: недостаточно прав!");
    }
    const operation = text === "➕ Добавить модератора";

    ctx.session.operationModerScene = {
      operation,
    };
    return ctx.scene.enter("OPERATION_MODER");
  }
}
