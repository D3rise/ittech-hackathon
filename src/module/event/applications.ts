import IContext from "../../interface/context/context.interface";
import ICustomEvent from "../../interface/module/customEvent/customEvent.interface";
import UserEntity, { UserRole } from "../../entity/user.entity";

export default class NewRequestEvent implements ICustomEvent {
  triggers = "newRequestEvent";

  async exec(ctx: IContext) {
    const userRepository = ctx.bot.db.getRepository(UserEntity);

    const managers = await userRepository.find({
      where: {
        role: UserRole.MODERATOR,
      },
    });

    return Promise.all(
      managers.map((manager) => {
        ctx.telegram.sendMessage(manager.telegramId, "Создана новая заявка");
      })
    );
  }
}
