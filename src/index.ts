import path from "path";
import Bot from "./bot";
import StartCommand from "./module/command/start.command";
import ParseMiddleware from "./module/middleware/parse.middleware";
import ValidateMiddleware from "./module/middleware/validate.middleware";
import MenuHears from "./module/hears/menu.hears";
import UserMiddleware from "./module/middleware/user.middleware";
import SendRequestScene from "./module/scene/sendRequest.scene";
import SendRequestHears from "./module/hears/sendRequest.hears";

const bot = new Bot(
  '5010074589:AAF1ie3vZnMq9j0Z73Lv_J1JSNMS_wudlYQ',
  {
    url: process.env.DB_URL,
    type: "postgres",
    entities: [path.join(__dirname, "entity", "*.entity.{js,ts}")],
    synchronize: process.env.NODE_ENV !== "production",
  },
  {
    endPoint: "localhost",
    port: 9000,
    accessKey: "AKIAIOSFODNN7EXAMPLE",
    secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    useSSL: false
  },
  "bottg"
);

bot.on("ready", () => {
  // Middlewares
  bot.useMiddleware(new UserMiddleware());
  bot.useMiddleware(new ParseMiddleware());
  bot.useMiddleware(new ValidateMiddleware());

  // Scenes
  bot.addScene(SendRequestScene);
  bot.createStage();

  // Hears
  bot.addHears(new MenuHears());
  bot.addHears(new SendRequestHears());

  // Actions

  // Commands

  // Start command
  bot.addStartCommand(new StartCommand());

  // Event
  bot.addCustomEvent(new NewRequestEvent());

  bot.launch().catch(bot.logger.error);
});
