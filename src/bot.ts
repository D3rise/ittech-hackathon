import { EventEmitter } from "stream";
import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { Connection, ConnectionOptions, createConnection } from "typeorm";
import { Logger, createLogger } from "winston";
import { Console } from "winston/lib/winston/transports";
import IContext from "./interface/context/context.interface";
import ICommand from "./interface/module/command/command.interface";
import IMiddleware from "./interface/module/middleware/middleware.interface";
import IAction from "./interface/module/action/action.interface";
import IHears from "./interface/module/hears/hears.interface";
import IStartCommand from "./interface/module/command/startCommand.interface";

export default class Bot extends EventEmitter {
  telegraf: Telegraf<IContext>;
  db: Connection;
  logger: Logger;

  startCommand: IStartCommand;
  hears: IHears[] = [];
  commands: ICommand[] = [];
  actions: IAction[] = [];

  /**
   * Bot is a class that allows us to create our own Telegram bot
   * @param {string} token Token of Telegram bot
   * @param {ConnectionOptions} databaseOptions Options to connect to database
   * @param {Partial<Telegraf.Options<Context<Update>>> | undefined} telegrafOptions Optional options for Telegraf client
   */
  constructor(token: string, databaseOptions?: ConnectionOptions) {
    super();
    this.logger = createLogger({
      level: process.env.NODE_ENV == "production" ? "info" : "debug",
      transports: [new Console()],
    });

    this._initDatabase(databaseOptions).then(() => {
      this._initTelegraf(token);
      this.telegraf.context.bot = this;

      this.emit("ready");
    });
  }

  private _initTelegraf(token: string) {
    this.telegraf = new Telegraf<IContext>(token);

    this.logger.log("info", "Successfully initialized Telegraf client");
  }

  private async _initDatabase(options?: ConnectionOptions) {
    this.db = options
      ? await createConnection(options)
      : await createConnection();
    this.logger.log("info", "Successfully connected to database");
  }

  /**
   * Add handler for messages with some content
   * @see https://telegraf.js.org/classes/Telegraf.html#hears
   * @param {IHears} hears Hears handler
   */
  addHears(hears: IHears) {
    this.hears.push(hears);
    this.telegraf.hears(hears.triggers, hears.exec);
  }

  /**
   * Add command handler
   * @see https://telegraf.js.org/classes/Telegraf.html#command
   * @param {ICommand} command Command to add
   */
  addCommand(command: ICommand) {
    this.commands.push(command);
    this.telegraf.command(command.name, command.exec);
  }

  /**
   * Add command that executes when user starts bot
   * @see https://telegraf.js.org/classes/Telegraf.html#start
   * @param {IStartCommand} command Command to add
   */
  addStartCommand(command: IStartCommand) {
    if (this.startCommand) {
      throw new Error("Start command already exists!");
    }

    this.startCommand = command;
    this.telegraf.start(command.exec);
  }

  /**
   * Add middleware that handles callback queries
   * @see https://telegraf.js.org/classes/Telegraf.html#action
   * @param {IAction} action Middlware (action) to add
   */
  addAction(action: IAction) {
    this.actions.push(action);
    this.telegraf.action(action.triggers, action.exec);
  }

  /**
   * Add
   * @see https://telegraf.js.org/classes/Telegraf.html#middleware
   * @param {IMiddleware} middleware
   */
  useMiddleware(middleware: IMiddleware) {
    this.telegraf.use(middleware.exec);
  }

  /**
   * Launch bot
   */
  async launch() {
    await this.telegraf.launch();
    this.logger.log("info", `Launched bot ${this.telegraf.botInfo?.username}`);
  }
}
