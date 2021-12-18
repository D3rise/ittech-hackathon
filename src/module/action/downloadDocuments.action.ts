import IAction from "../../interface/module/action/action.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize, Markup } from "telegraf";
import RequestEntity from "../../entity/request.entity";
import archiver from "archiver";

export default class DownloadDocumentsAction implements IAction {
  triggers = /^downloadDocuments.*$/g;
  dependsOn = [new DownloadDocumentsMoreDocsAction()];

  async exec(ctx: IContext) {
    await ctx.answerCbQuery();

    const data = deunionize(ctx.callbackQuery)?.data;
    if (!data) return;

    const requestId = data.split(":").at(-1);
    if (!requestId) return;

    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const request = await requestRepo.findOne(requestId, {
      relations: ["documents"],
    });
    if (!request) return;

    const archive = archiver("zip", {
      zlib: {
        level: 9,
      },
    });

    const { documents } = request;

    for (const [i, doc] of documents.entries()) {
      const { minioId, fileName } = doc;
      const isPhoto = minioId.split(":").at(-1) === "photo";
      const filename = isPhoto ? `Документ ${i + 1}.png` : fileName;

      const file = await ctx.bot.minio.getObject(ctx.bot.minioBucket, minioId);
      archive.append(file, { name: filename });
    }

    await archive.finalize();
    await ctx.replyWithDocument(
      {
        source: archive,
        filename: `Запрос ${request.id}.zip`,
      },
      { caption: `Документы от запроса #${request.id}` }
    );
    return ctx.reply(
      "Нажмите эту кнопку, если захотите запросить у абитуриента дополнительные документы.",
      Markup.inlineKeyboard([
        Markup.button.callback(
          "Запросить доп. документы",
          "dlDocs.requestMoreDoc"
        ),
      ])
    );
  }
}

export class DownloadDocumentsMoreDocsAction implements IAction {
  triggers = "dlDocs.requestMoreDoc";

  exec(ctx: IContext) {
    return ctx.scene.enter("REQUEST_DOCUMENT");
  }
}
