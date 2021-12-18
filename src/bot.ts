import { EventEmitter } from "stream";
import { Scenes, Telegraf } from "telegraf";
import { Connection, ConnectionOptions, createConnection } from "typeorm";
import { Logger, createLogger } from "winston";
import { Console } from "winston/lib/winston/transports";
import { BaseScene } from "telegraf/typings/scenes";
import LocalStorage from "telegraf-session-local";
import IContext from "./interface/context/context.interface";
import ICommand from "./interface/module/command/command.interface";
import IMiddleware from "./interface/module/middleware/middleware.interface";
import IAction from "./interface/module/action/action.interface";
import IHears from "./interface/module/hears/hears.interface";
import IStartCommand from "./interface/module/command/startCommand.interface";
import LocalSession from "telegraf-session-local";
import ICustomEvent from "./interface/module/customEvent/customEvent.interface";
import IEvent from "./interface/module/event/event.interface";

export default class Bot extends EventEmitter {
  telegraf: Telegraf<IContext>;
  db: Connection;
  logger: Logger;

  startCommand: IStartCommand;
  hears: IHears[] = [];
  commands: ICommand[] = [];
  actions: IAction[] = [];
  events: IEvent[];
  customEvents: ICustomEvent[];

  scenes: Scenes.BaseScene<IContext>[];
  stage: Scenes.Stage<IContext>;

  /**
   * Bot is a class that allows us to create our own Telegram bot
   * @param {string} token Token of Telegram bot
   * @param {ConnectionOptions} databaseOptions Options to connect to database
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
      this.telegraf.use(
        new LocalSession({ storage: LocalStorage.storageMemory }).middleware()
      );

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
   * Add scene to bot's stage
   * @param scene Scene to add
   */
  addScene(scene: BaseScene<IContext>) {
    if (this.stage) {
      throw new Error("You can't add scenes after stage was created!");
    }

    this.scenes.push(scene);
  }

  /**
   * Create bots stage with all scenes that we added
   */
  createStage() {
    if (this.stage) {
      throw new Error("Stage already exists!");
    }

    this.stage = new Scenes.Stage<IContext>(this.scenes);
    this.telegraf.use(this.stage.middleware());
  }

  /**
   * Add event handler for Telegraf events
   * @param {IEvent} event Event handler class
   */
  addEvent(event: IEvent) {
    this.events.push(event);
    this.telegraf.on(event.triggers, event.exec);
  }

  /**
   * Add event handler for Bot events (not telegraf, but this class)
   * @param {ICustomEvent} event Event handler to add
   */
  addCustomEvent(event: ICustomEvent) {
    this.customEvents.push(event);
    this.on(event.triggers, event.exec);
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
