import { deunionize, Markup, Scenes } from "telegraf";
import IContext from "../../interface/context/context.interface";
import RequestEntity from "../../entity/request.entity";
import DocumentEntity from "../../entity/document.entity";
import https from "https";
import { IncomingMessage } from "http";

const SendRequestScene = new Scenes.BaseScene<IContext>("ADD_DOCUMENT");

const defaultInlineKeyboardButtons = [
  Markup.button.callback("❌ Отмена", "cancel"),
];
const defaultInlineKeyboard = Markup.inlineKeyboard(
  defaultInlineKeyboardButtons
);

SendRequestScene.enter((ctx: IContext) => {
  ctx.session.addDocumentScene = {
    data: {},
  };
  ctx.session.addDocumentScene.currentOperation = "getName";
  return ctx.reply(
    'Пожалуйста, введите свое полное имя в следующем формате: "Фамилия Имя Отчество"',
    defaultInlineKeyboard
  );
});

// TODO: исправить эти варнинги
// noinspection TypeScriptValidateJSTypes
SendRequestScene.action("cancel", async (ctx: IContext) => {
  await ctx.answerCbQuery();
  await ctx.bot.mainMenu(ctx);
  return ctx.scene.leave();
});

// noinspection TypeScriptValidateJSTypes
SendRequestScene.action("send", async (ctx: IContext) => {
  const { fullName, phoneNumber, document } = ctx.session.addDocumentScene.data;
  const { user } = ctx.session;

  const requestRepo = ctx.bot.db.getRepository(RequestEntity);
  const documentRepo = ctx.bot.db.getRepository(DocumentEntity);

  const requestEntity = requestRepo.create({
    author: user,
    name: fullName[0],
    surname: fullName[1],
    middlename: fullName[2],
    telephone: phoneNumber,
  });
  await requestRepo.save(requestEntity);

  const documentEntity = documentRepo.create({
    request: requestEntity,
    fileName: document.fileName,
    minioId: `document:${requestEntity.id}:0:${document.type}`,
  });
  await documentRepo.save(documentEntity);

  const url = await ctx.telegram.getFileLink(document.data.file_id);
  https.get(url, (res: IncomingMessage) => {
    ctx.bot.minio.putObject(ctx.bot.minioBucket, documentEntity.minioId, res);
  });

  await ctx.answerCbQuery();

  ctx.bot.emit("newRequestEvent", requestEntity.id, fullName);
  await ctx.replyWithHTML("<i>Запрос был успешно отправлен колледжу!</i>");
  return ctx.scene.leave();
});

// noinspection TypeScriptValidateJSTypes
SendRequestScene.on("message", (ctx: IContext) => {
  const message = deunionize(ctx.message);
  const text = message?.text;
  const document = message?.document;
  const photoSizes = message?.photo;

  switch (ctx.session.addDocumentScene.currentOperation) {
    case "getName":
      return getName();
    case "getPhone":
      return getPhone();
    case "getDiplomaDocument":
      return getDiplomaDocument();
  }

  function getName() {
    const nameRegexp = /^[а-яА-ЯёЁ]+ [а-яА-ЯёЁ]+ [а-яА-ЯёЁ]+$/g;
    const wrongMessageError =
      'Неверное сообщение! Вы должны ввести имя в следующем формате: "Фамилия Имя Отчество"' +
      '\nНапример: "Иванов Иван Иванович"';

    if (!text || !nameRegexp.test(text)) {
      return ctx.reply(wrongMessageError, defaultInlineKeyboard);
    }

    // Uppercase all parts of name
    ctx.session.addDocumentScene.data.fullName = text
      .split(" ")
      .map(
        (elem: string, i: number, arr) =>
          (arr[i] = elem[0].toUpperCase() + elem.slice(1))
      );
    ctx.session.addDocumentScene.currentOperation = "getPhone";

    return ctx.reply(
      'Введите ваш номер телефона в следующем формате: "+79287745621"' +
        "\nЭтот номер телефона будет использован колледжем чтобы связаться с вами.",
      defaultInlineKeyboard
    );
  }

  async function getPhone() {
    const phoneRegexp = new RegExp(/^(\+7)[0-9]{10}$/);
    const wrongMessageError =
      'Неверный номер телефона! Вы должны ввести его в следующем формате: "+79287745621"' +
      "\nВведите номер телефона без пробелов, с указанием кода страны.";

    if (!text) {
      return ctx.reply(wrongMessageError, defaultInlineKeyboard);
    }

    if (!phoneRegexp.test(text)) {
      return ctx.reply(wrongMessageError, defaultInlineKeyboard);
    }

    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const exists = await requestRepo.findOne({ where: { telephone: text } });
    if (exists) {
      return ctx.reply(
        "Ошибка: такой номер уже существует! Введите валидный номер телефона.",
        defaultInlineKeyboard
      );
    }

    ctx.session.addDocumentScene.data.phoneNumber = text;
    ctx.session.addDocumentScene.currentOperation = "getDiplomaDocument";
    return ctx.reply(
      "Пожалуйста, отправьте ваш диплом о среднем общем образовании." +
        "\nЭтот документ будет необходим колледжу для того чтобы вы могли поступить." +
        "\nПожалуйста, прикрепите документ к сообщению без сжатия.",
      defaultInlineKeyboard
    );
  }

  async function getDiplomaDocument() {
    const wrongMessageError =
      "Неверный документ! Пожалуйста, прикрепите к вашему сообщению документ об общем среднем образовании.";

    if (!document && !photoSizes) {
      return ctx.reply(wrongMessageError, defaultInlineKeyboard);
    }

    if (document) {
      ctx.session.addDocumentScene.data.document = {
        type: "document",
        data: document,
        fileName: document.file_name,
      };
    } else {
      const largestPhoto = photoSizes?.at(-1);
      ctx.session.addDocumentScene.data.document = {
        type: "photo",
        data: largestPhoto,
      };
    }

    return ctx.replyWithMarkdownV2(
      "Ваша заявка готова\\! Просмотрите \\- все верно?" +
        `\n**Полное имя**: ${ctx.session.addDocumentScene.data.fullName.join(
          " "
        )}` +
        `\n**Номер телефона**: ${ctx.session.addDocumentScene.data.phoneNumber.replace(
          "+",
          "\\+"
        )}` +
        "\n**Документ об общем среднем образовании** прикреплен",
      Markup.inlineKeyboard([
        Markup.button.callback("Да, всё в порядке", "send"),
        ...defaultInlineKeyboardButtons,
      ])
    );
  }
});

export default SendRequestScene;
