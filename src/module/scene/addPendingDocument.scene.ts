import { deunionize, Markup, Scenes } from "telegraf";
import IContext from "../../interface/context/context.interface";
import PendingDocumentEntity from "../../entity/pendingDocument.entity";
import RequestEntity from "../../entity/request.entity";
import DocumentEntity from "../../entity/document.entity";
import https from "https";

const AddPendingDocumentScene = new Scenes.BaseScene<IContext>(
  "ADD_PENDING_DOCUMENT"
);

const defaultKeyboardButtons = [Markup.button.callback("Отмена", "cancel")];
const defaultInlineKeyboard = Markup.inlineKeyboard(defaultKeyboardButtons);

AddPendingDocumentScene.enter((ctx: IContext) => {
  ctx.session.addPendingDocumentScene.data = {
    document: null,
  };
  ctx.session.addPendingDocumentScene.currentOperation = "getDocument";

  return ctx.reply(
    "Пожалуйста, отправьте выбранный требуемый документ.\n" +
      `Выбранный документ: ${ctx.session.addPendingDocumentScene.docName}\n` +
      `Описание требуемого документа: ${
        ctx.session.addPendingDocumentScene.docDescription ?? "Отсутствует"
      }`,
    defaultInlineKeyboard
  );
});

// noinspection TypeScriptValidateJSTypes
AddPendingDocumentScene.on("message", (ctx: IContext) => {
  const { currentOperation } = ctx.session.addPendingDocumentScene;
  switch (currentOperation) {
    case "getDocument":
      return getDocument(ctx);
  }
});

async function getDocument(ctx: IContext) {
  const message = deunionize(ctx.message);
  if (!message) return;

  const { document, photo } = message;
  if (!document && !photo) {
    return ctx.reply(
      "Ошибка: неверное сообщение! Пожалуйста, отправьте требуемый документ.",
      defaultInlineKeyboard
    );
  }

  const { docName } = ctx.session.addPendingDocumentScene;
  const isPhoto = !!photo; // двойное отрицание, получаем булевое значение
  const extension = isPhoto ? "png" : document?.file_name?.split(".").at(-1);
  const fileName = `${docName}.${extension}`;

  const pendingDocumentRepo = ctx.bot.db.getRepository(PendingDocumentEntity);
  const pendingDocument = await pendingDocumentRepo.findOne(
    ctx.session.addPendingDocumentScene.docId,
    { relations: ["request", "request.documents"] }
  );
  console.log(pendingDocument);
  if (!pendingDocument) return;

  const requestRepo = ctx.bot.db.getRepository(RequestEntity);
  const { request } = pendingDocument;
  const minioId = `document:${request.id}:${request.documents.length}:${
    isPhoto ? "photo" : "document"
  }`;

  const documentRepo = ctx.bot.db.getRepository(DocumentEntity);
  const documentEntity = documentRepo.create({
    request,
    fileName,
    minioId,
  });
  request.documents.push(documentEntity);

  const fileId = isPhoto ? photo.at(-1)?.file_id : document?.file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId!);

  https.get(fileLink, async (file) => {
    await ctx.bot.minio.putObject(ctx.bot.minioBucket, minioId, file);
    await Promise.all([
      documentRepo.save(documentEntity),
      requestRepo.save(request),
      pendingDocumentRepo.softRemove(pendingDocument),
    ]);

    await ctx.reply("Документ успешно добавлен!");
    return ctx.scene.leave();
  });
}

// noinspection TypeScriptValidateJSTypes
AddPendingDocumentScene.action("cancel", (ctx: IContext) => {
  return ctx.scene.leave();
});

AddPendingDocumentScene.leave((ctx: IContext) => {
  return ctx.bot.mainMenu(ctx);
});

export default AddPendingDocumentScene;
