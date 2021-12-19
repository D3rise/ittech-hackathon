import path from "path";
import Bot from "./bot";
import StartCommand from "./module/command/start.command";
import ParseMiddleware from "./module/middleware/parse.middleware";
import ValidateMiddleware from "./module/middleware/validate.middleware";
import MenuHears from "./module/hears/menu.hears";
import UserMiddleware from "./module/middleware/user.middleware";
import NewRequestEvent from "./module/customEvent/newRequest.event";
import SendRequestScene from "./module/scene/sendRequest.scene";
import SendRequestHears from "./module/hears/sendRequest.hears";
import AllRequestHears from "./module/hears/allRequest.hears";
import DownloadDocumentsAction from "./module/action/downloadDocuments.action";
import DownloadAllDocumentsHears from "./module/hears/downloadAllDocuments.hears";
import RequestDocumentScene from "./module/scene/requestDocument.scene";
import RequestStatusChangeEvent from "./module/customEvent/requestStatusChange.event";
import ShowRequestAction from "./module/action/showRequest.action";
import { RequestDocumentAction } from "./module/action/requestDocument.action";
import DeleteRequestAction from "./module/action/deleteRequest.action";
import OperateRequestAction from "./module/action/operateRequest.action";
import AddPendingDocumentScene from "./module/scene/addPendingDocument.scene";
import AttachPendingDocumentAction from "./module/action/attachPendingDocument.action";
import EulaMiddleware from "./module/middleware/eula.middleware";
import EulaAction from "./module/action/eula.action";
import OperationModeratorHears from "./module/hears/operationModerator.hears";
import OperationModerScene from "./module/scene/operationModerator.scene";
import RoleChangeEvent from "./module/customEvent/roleChange.event";
import AllModeratorsHears from "./module/hears/allModerators.hears";
import SelfIdHears from "./module/hears/selfId.hears";
import { AddPendingDocumentEvent } from "./module/customEvent/addPendingDocument.event";

const {
  TELEGRAM_BOT_TOKEN,
  MINIO_HOST,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  DB_URL,
} = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.log("Ошибка: Вы должны указать токен бота!");
  process.exit(1);
}

if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_HOST) {
  console.log("Ошибка: Вы должны указать данные для MinIO!");
  process.exit(1);
}

const bot = new Bot(
  TELEGRAM_BOT_TOKEN,
  {
    url: DB_URL,
    type: "postgres",
    entities: [path.join(__dirname, "entity", "*.entity.{js,ts}")],
    synchronize: true,
  },
  {
    endPoint: MINIO_HOST,
    port: 9000,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
    useSSL: false,
  },
  "bottg"
);

bot.on("ready", () => {
  // Middlewares
  bot.useMiddleware(new UserMiddleware());
  bot.useMiddleware(new EulaMiddleware());
  bot.useMiddleware(new ParseMiddleware());
  bot.useMiddleware(new ValidateMiddleware());

  // Scenes
  bot.addScene(AddPendingDocumentScene);
  bot.addScene(SendRequestScene);
  bot.addScene(RequestDocumentScene);
  bot.addScene(OperationModerScene);
  bot.createStage();

  // Hears
  bot.addHears(new MenuHears());
  bot.addHears(new SendRequestHears());
  bot.addHears(new AllRequestHears());
  bot.addHears(new DownloadAllDocumentsHears());
  bot.addHears(new OperationModeratorHears());
  bot.addHears(new AllModeratorsHears());
  bot.addHears(new SelfIdHears());

  // Actions
  bot.addAction(new DownloadDocumentsAction());
  bot.addAction(new ShowRequestAction());
  bot.addAction(new RequestDocumentAction());
  bot.addAction(new DeleteRequestAction());
  bot.addAction(new OperateRequestAction());
  bot.addAction(new AttachPendingDocumentAction());
  bot.addAction(new EulaAction());

  // Start command
  bot.addStartCommand(new StartCommand());

  // Event
  bot.addCustomEvent(new NewRequestEvent());
  bot.addCustomEvent(new RequestStatusChangeEvent());
  bot.addCustomEvent(new RoleChangeEvent());
  bot.addCustomEvent(new AddPendingDocumentEvent());

  bot.launch().catch(bot.logger.error);
});
