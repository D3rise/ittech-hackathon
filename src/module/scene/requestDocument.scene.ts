import { deunionize, Markup, Scenes } from "telegraf";
import IContext from "../../interface/context/context.interface";
import PendingDocumentEntity from "../../entity/pendingDocument.entity";
import RequestEntity, { RequestStatus } from "../../entity/request.entity";

const defaultKeyboardButtons = [Markup.button.callback("Отмена", "cancel")];
const defaultKeyboard = Markup.inlineKeyboard(defaultKeyboardButtons);

// noinspection TypeScriptValidateJSTypes
const RequestDocumentScene = new Scenes.WizardScene<IContext>(
  "REQUEST_DOCUMENT",
  async (ctx: IContext): Promise<any> => {
    ctx.session.requestDocumentScene.data = {
      docName: null,
      description: null,
    };

    await ctx.reply(
      "Пожалуйста, введите название документа, который вы хотите запросить",
      defaultKeyboard
    );

    return ctx.wizard.next();
  },
  (ctx: IContext): any => {
    const message = deunionize(ctx.message);
    const docName = message?.text;
    if (!docName) {
      return ctx.reply(
        "Ошибка: Неверное сообщение! Пожалуйста, введите название документа, который вы хотите запросить.",
        defaultKeyboard
      );
    }

    ctx.session.requestDocumentScene.data.docName = docName;
    return ctx.wizard.next();
  },
  (ctx: IContext): any => {
    return ctx.reply(
      "Желаете добавить описание с пояснениями для документа?",
      Markup.inlineKeyboard([
        ...defaultKeyboardButtons,
        Markup.button.callback("Да", "addDescription"),
        Markup.button.callback("Нет", "skipAddDescription"),
      ])
    );
  },
  async (ctx: IContext): Promise<any> => {
    const message = deunionize(ctx.message);
    const description = message?.text;
    if (!description) {
      return ctx.reply(
        "Ошибка: Неверное сообщение! Пожалуйста, введите описание документа, который вы хотите запросить.",
        Markup.inlineKeyboard([
          ...defaultKeyboardButtons,
          Markup.button.callback(
            "Пропустить добавление описания",
            "skipAddDescription"
          ),
        ])
      );
    }

    ctx.session.requestDocumentScene.data.description = description;
    return ctx.wizard.next();
  },
  async (ctx: IContext): Promise<any> => {
    const { requestId } = ctx.session.requestDocumentScene;
    const { docName, description } = ctx.session.requestDocumentScene.data;

    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const request = await requestRepo.findOne(requestId, {
      relations: ["pendingDocuments"],
    });
    if (!request) return;

    const pendingDocRepo = ctx.bot.db.getRepository(PendingDocumentEntity);
    const pendingDocument = pendingDocRepo.create({
      request,
      name: docName,
      description,
    });
    await pendingDocRepo.save(pendingDocument);

    request.pendingDocuments.push(pendingDocument);
    await requestRepo.save(request);

    ctx.bot.emit("requestStatusChange", RequestStatus.DOCS_PENDING, requestId);
    await ctx.reply("Запрос документа был успешно отправлен абитуриенту!");
    return ctx.scene.leave();
  }
);

RequestDocumentScene.action("skipAddDescription", (ctx: IContext) => {
  ctx.wizard.selectStep(5);
});

RequestDocumentScene.action("cancel", async (ctx: IContext) => {
  await ctx.answerCbQuery();
  ctx.scene.leave();
});

// noinspection TypeScriptValidateJSTypes
RequestDocumentScene.leave(async (ctx: IContext) => {
  return ctx.bot.mainMenu(ctx);
});
