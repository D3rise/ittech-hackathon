import path from "path";
import Bot from "./bot";
import HelpCommand from "./module/command/help.command";
import StartCommand from "./module/command/start.command";
import ParseMiddleware from "./module/middleware/parse.middleware";
import ValidateMiddleware from "./module/middleware/validate.middleware";
import HelloAction from "./module/action/basic/hello.action";
import HelloThereHears from "./module/hears/hellothere.hears";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!, {
  url: process.env.DB_URL,
  type: "postgres",
  entities: [path.join(__dirname, "entity", "*.entity.{js,ts}")],
});

bot.on("ready", () => {
  bot.useMiddleware(new ParseMiddleware());
  bot.useMiddleware(new ValidateMiddleware());

  bot.addHears(new HelloThereHears());
  bot.addAction(new HelloAction());
  bot.addCommand(new HelpCommand());
  bot.addStartCommand(new StartCommand());

  bot.launch().catch(bot.logger.error);
});
