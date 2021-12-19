import { deunionize, Markup, Scenes } from "telegraf";
import IContext from "../../interface/context/context.interface";
import PendingDocumentEntity from "../../entity/pendingDocument.entity";
import RequestEntity, { RequestStatus } from "../../entity/request.entity";

const defaultKeyboardButtons = [Markup.button.callback("❌ Отмена", "cancel")];
const defaultKeyboard = Markup.inlineKeyboard(defaultKeyboardButtons);

const RequestDocumentScene = new Scenes.BaseScene<IContext>("REQUEST_DOCUMENT");

RequestDocumentScene.enter((ctx: IContext) => {
  ctx.session.requestDocumentScene.data = {
    docName: null,
    description: null,
  };
  ctx.session.requestDocumentScene.currentOperation = "getName";

  return ctx.reply(
    "Пожалуйста, введите название документа, который вы хотите запросить",
    defaultKeyboard
  );
});

RequestDocumentScene.on("message", (ctx) => {
  switch (ctx.session.requestDocumentScene.currentOperation) {
    case "getName":
      return getName(ctx);
    case "getDescriptionQuestion":
      return getDescriptionQuestion(ctx);
    case "getDescription":
      return getDescription(ctx);
    case "send":
      return send(ctx);
  }
});

// noinspection TypeScriptValidateJSTypes
RequestDocumentScene.action("skipAddDescription", async (ctx: IContext) => {
  await ctx.answerCbQuery();
  await send(ctx);
  return ctx.scene.leave();
});

// noinspection TypeScriptValidateJSTypes
RequestDocumentScene.action("addDescription", async (ctx: IContext) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    "Пожалуйста, введите описание для документа.",
    Markup.inlineKeyboard([
      ...defaultKeyboardButtons,
      Markup.button.callback("Пропустить описание", "skipAddDescription"),
    ])
  );
  ctx.session.requestDocumentScene.currentOperation = "getDescription";
});

// noinspection TypeScriptValidateJSTypes
RequestDocumentScene.action("cancel", async (ctx: IContext) => {
  await ctx.answerCbQuery();
  ctx.scene.leave();
});

// noinspection TypeScriptValidateJSTypes
RequestDocumentScene.leave(async (ctx: IContext) => {
  return ctx.bot.mainMenu(ctx);
});

function getName(ctx: IContext): any {
  const message = deunionize(ctx.message);
  const text = message?.text;

  if (!text)
    return ctx.reply(
      "Ошибка: Неверное сообщение! Пожалуйста, введите название требуемого документа."
    );

  ctx.session.requestDocumentScene.data.docName = text;
  return getDescriptionQuestion(ctx);
}

function getDescriptionQuestion(ctx: IContext): any {
  return ctx.reply(
    "Желаете добавить описание с пояснениями для документа?",
    Markup.inlineKeyboard([
      ...defaultKeyboardButtons,
      Markup.button.callback("Да", "addDescription"),
      Markup.button.callback("Нет", "skipAddDescription"),
    ])
  );
}

async function getDescription(ctx: IContext): Promise<any> {
  const message = deunionize(ctx.message);
  const description = message?.text;
  if (!description) {
    return ctx.reply(
      "Ошибка: Неверное сообщение! Пожалуйста, введите описание документа, который вы хотите запросить.",
      Markup.inlineKeyboard([
        ...defaultKeyboardButtons,
        Markup.button.callback("Пропустить описание", "skipAddDescription"),
      ])
    );
  }

  ctx.session.requestDocumentScene.data.description = description;
  await send(ctx);
  return ctx.scene.leave();
}

async function send(ctx: IContext): Promise<any> {
  const { requestId } = ctx.session.requestDocumentScene;
  const { docName, description } = ctx.session.requestDocumentScene.data;

  const requestRepo = ctx.bot.db.getRepository(RequestEntity);
  const request = await requestRepo.findOne(requestId, {
    relations: ["pendingDocuments"],
  });
  console.log(requestId);
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

export default RequestDocumentScene;
