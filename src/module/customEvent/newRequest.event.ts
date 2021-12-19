import ICustomEvent from "../../interface/module/customEvent/customEvent.interface";
import UserEntity, { UserRole } from "../../entity/user.entity";
import Bot from "../../bot";

export default class NewRequestEvent implements ICustomEvent {
  triggers = "newRequestEvent";

  async exec(bot: Bot, requestId: number, fullName: string[]) {
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
          `Создана новая заявка от абитуриента по ФИО "${fullName.join(
            " "
          )}" под номером №${requestId}`
        );
      })
    );
  }
}
