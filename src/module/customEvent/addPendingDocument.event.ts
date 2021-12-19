import ICustomEvent from "../../interface/module/customEvent/customEvent.interface";
import Bot from "../../bot";
import UserEntity, { UserRole } from "../../entity/user.entity";

export class AddPendingDocumentEvent implements ICustomEvent {
  triggers = "addPendingDocument";

  async exec(bot: Bot, requestId: number, docName: string) {
    const userRepo = bot.db.getRepository(UserEntity);
    const moderators = await userRepo.find({
      where: { role: UserRole.MODERATOR },
    });
    const message = `Требуемый документ "${docName}" к заявке #${requestId} был добавлен!`;

    moderators.forEach((moderator) => {
      bot.telegraf.telegram.sendMessage(moderator.telegramId, message);
    });
  }
}
