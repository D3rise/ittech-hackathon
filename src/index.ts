import path from "path";
import Bot from "./bot";
import StartCommand from "./module/command/start.command";
import ParseMiddleware from "./module/middleware/parse.middleware";
import ValidateMiddleware from "./module/middleware/validate.middleware";
import MenuHears from "./module/hears/menu.hears";
import UserMiddleware from "./module/middleware/user.middleware";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!, {
  url: process.env.DB_URL,
  type: "postgres",
  entities: [path.join(__dirname, "entity", "*.entity.{js,ts}")],
  synchronize: process.env.NODE_ENV !== "production",
});

bot.on("ready", () => {
  // Middlewares
  bot.useMiddleware(new UserMiddleware());
  bot.useMiddleware(new ParseMiddleware());
  bot.useMiddleware(new ValidateMiddleware());

  // Hears
  bot.addHears(new MenuHears());

  // Actions

  // Commands

  // Start command
  bot.addStartCommand(new StartCommand());

  bot.createStage();

  bot.launch().catch(bot.logger.error);
});
