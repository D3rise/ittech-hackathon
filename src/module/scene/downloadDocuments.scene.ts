import { deunionize, Markup, Scenes } from "telegraf";
import IContext from "../../interface/context/context.interface";
import RequestEntity from "../../entity/request.entity";
import { UserRole } from "../../entity/user.entity";
const DownloadDocumentsScene = new Scenes.BaseScene<IContext>(
  "DOWNLOAD_DOCUMENTS"
);

const defaultButtons = [Markup.button.callback("❌ Отмена", "cancel")];
const defaultInlineKeyboard = Markup.inlineKeyboard(defaultButtons);

DownloadDocumentsScene.enter((ctx: IContext) => {
  if (ctx.session.user.role !== UserRole.MODERATOR) {
    return ctx.reply("Ошибка: У вас недостаточно прав!").then(ctx.scene.leave);
  }

  ctx.session.downloadDocsScene = {
    data: {
      requestId: null,
    },
    currentOperation: "getRequestId",
  };

  return ctx.replyWithHTML(
    "<i>Введите номер заявки, документы которой хотите скачать:</i>",
    defaultInlineKeyboard
  );
});

// noinspection TypeScriptValidateJSTypes
DownloadDocumentsScene.action("cancel", async (ctx: IContext) => {
  await ctx.answerCbQuery();
  await ctx.scene.leave();
});

DownloadDocumentsScene.leave(async (ctx: IContext) => {
  return ctx.bot.mainMenu(ctx);
});

// noinspection TypeScriptValidateJSTypes
DownloadDocumentsScene.on("message", (ctx: IContext) => {
  const message = deunionize(ctx.message);
  const text = message?.text;

  switch (ctx.session.downloadDocsScene.currentOperation) {
    case "getRequestId":
      return getRequestId();
  }

  async function getRequestId() {
    const wrongMessageError =
      "Неверное сообщение! Пожалуйста, введите верный номер заявки.";
    const requestNotFoundError =
      "Заявка с таким номером не найдена! Пожалуйста, введите верный номер заявки.";

    if (!text || !Number.isInteger(text))
      return ctx.reply(wrongMessageError, defaultInlineKeyboard);

    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const requestId = Number(text);

    const request = await requestRepo.findOne({
      where: {
        id: requestId,
      },
      relations: ["documents"],
    });
    if (!request) return ctx.reply(requestNotFoundError, defaultInlineKeyboard);

    const { documents } = request;

    await ctx.reply(
      `Документы, прикрепленные к заявке №${requestId}:`,
      defaultInlineKeyboard
    );

    for (const doc of documents) {
      const file = await ctx.bot.minio.getObject(
        ctx.bot.minioBucket,
        doc.minioId
      );

      const isPhoto = doc.minioId.split(":").at(-1) === "photo";
      const filename = isPhoto ? "document.png" : doc.fileName;
      await ctx.replyWithDocument(
        { source: file, filename },
        defaultInlineKeyboard
      );
    }
  }
});
