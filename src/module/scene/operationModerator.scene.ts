import { deunionize, Markup, Scenes } from "telegraf";
import IContext from "../../interface/context/context.interface";
import UserEntity, { UserRole } from "../../entity/user.entity";

const OperationModerScene = new Scenes.BaseScene<IContext>("OPERATION_MODER");

const defaultKeyboardButtons = [Markup.button.callback("Отмена", "cancel")];
const defaultKeyboard = Markup.inlineKeyboard(defaultKeyboardButtons);

OperationModerScene.enter((ctx: IContext) => {
  const { operation } = ctx.session.operationModerScene;
  return ctx.reply(
    `Введите ID пользователя, которого хотите ${
      operation ? "назначить модератором" : "убрать с должности модератора"
    }`,
    defaultKeyboard
  );
});

// noinspection TypeScriptValidateJSTypes
OperationModerScene.on("message", async (ctx: IContext) => {
  const message = deunionize(ctx.message);
  const text = message?.text;
  const errorText =
    "Ошибка: неверное сообщение! Пожалуйста, введите ID пользователя.";

  if (!text || !Number(text)) return ctx.reply(errorText, defaultKeyboard);
  if (Number(text) === ctx.from?.id)
    return ctx.reply(
      "Ошибка: вы не можете изменить свою роль!\nВведите валидный ID пользователя.",
      defaultKeyboard
    );

  const userRepo = ctx.bot.db.getRepository(UserEntity);
  const user = await userRepo.findOne({ where: { telegramId: text } });
  if (!user)
    return ctx.reply(
      "Ошибка: пользователь не найден! Убедитесь в правильности набора ID.",
      defaultKeyboard
    );

  const { operation } = ctx.session.operationModerScene;
  user.role = operation ? UserRole.MODERATOR : UserRole.USER;
  await userRepo.save(user);

  ctx.bot.emit("roleChange", ctx, user, operation);
  await ctx.reply(
    `Пользователь с ID ${user.telegramId} был успешно ${
      operation ? "повышен до роли модератор" : "понижен до роли пользователь"
    }!`
  );
  return ctx.scene.leave();
});

// noinspection TypeScriptValidateJSTypes
OperationModerScene.action("cancel", async (ctx: IContext) => {
  await ctx.answerCbQuery();
  ctx.scene.leave();
});

OperationModerScene.leave((ctx: IContext) => {
  return ctx.bot.mainMenu(ctx);
});

export default OperationModerScene;
