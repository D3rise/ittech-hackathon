import ICustomEvent from "../../interface/module/customEvent/customEvent.interface";
import UserEntity, { UserRole } from "../../entity/user.entity";
import Bot from "../../bot";

export default class NewRequestEvent implements ICustomEvent {
  triggers = "newRequestEvent";

  async exec(bot: Bot) {
    const userRepository = bot.db.getRepository(UserEntity);

    const managers = await userRepository.find({
      where: {
        role: UserRole.MODERATOR,
      },
    });

    return Promise.all(
      managers.map((manager) => {
        bot.telegraf.telegram.sendMessage(
          manager.telegramId,
          `Создана новая заявка`
        );
      })
    );
  }
}
