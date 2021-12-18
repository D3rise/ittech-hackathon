import { EventEmitter } from "stream";
import { Markup, Scenes, Telegraf } from "telegraf";
import { Connection, ConnectionOptions, createConnection } from "typeorm";
import { Logger, createLogger } from "winston";
import { Console } from "winston/lib/winston/transports";
import * as Minio from "minio";
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
import { UserRole } from "./entity/user.entity";

export default class Bot extends EventEmitter {
  telegraf: Telegraf<IContext>;
  db: Connection;
  minio: Minio.Client;
  minioBucket: string;
  logger: Logger;

  startCommand: IStartCommand;
  hears: IHears[] = [];
  commands: ICommand[] = [];
  actions: IAction[] = [];
  events: IEvent[] = [];
  customEvents: ICustomEvent[] = [];

  scenes: Scenes.BaseScene<IContext>[] = [];
  stage: Scenes.Stage<IContext>;

  mainMenuButton: string = "Вернуться в главное меню";

  /**
   * Bot is a class that allows us to create our own Telegram bot
   * @param {string} token Token of Telegram bot
   * @param {ConnectionOptions} databaseOptions Options to connect to database
   * @param {Minio.ClientOptions} minioOptions Options for Minio client
   * @param {string} minioBucketName
   */
  constructor(
    token: string,
    databaseOptions: ConnectionOptions,
    minioOptions: Minio.ClientOptions,
    minioBucketName: string
  ) {
    super();
    this.logger = createLogger({
      level: process.env.NODE_ENV == "production" ? "info" : "debug",
      transports: [new Console()],
    });

    this._initDatabase(databaseOptions)
      .then(async () => {
        await this._initMinio(minioOptions, minioBucketName);
      })
      .then(() => {
        this._initTelegraf(token);
        this.telegraf.context.bot = this;
        this.telegraf.use(
          new LocalSession({ storage: LocalStorage.storageMemory }).middleware()
        );
        this.telegraf.use(Telegraf.log());

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

  private async _initMinio(options: Minio.ClientOptions, bucketName: string) {
    this.minio = new Minio.Client(options);
    this.minioBucket = bucketName;

    const exists = await this.minio.bucketExists(bucketName);
    if (!exists) {
      await this.minio.makeBucket(bucketName, "main");
    }
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
  addScene(scene: Scenes.BaseScene<IContext>) {
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
    this.on(event.triggers, event.exec.bind(event, this));
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

    if (action.dependsOn) {
      for (const dependency of action.dependsOn) {
        this.actions.push(dependency);
        this.telegraf.action(dependency.triggers, dependency.exec);
      }
    }
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
   * Return to main menu
   * @param ctx Context in which return to main menu
   */
  mainMenu(ctx: IContext) {
    const { user } = ctx.session;
    const buttons: string[] = [];

    switch (user.role) {
      case UserRole.USER:
        buttons.push(
          "Отправить заявку на поступление в колледж",
          "Просмотреть статусы моих заявок",
          "Удалить заявку"
        );
        break;
      case UserRole.MODERATOR:
        buttons.push(
          "Все заявки",
          "Просмотреть необработанные заявки",
          "Просмотреть уже обработанные заявки",
          "Скачать документы всех заявок",
          "Запросить дополнительные документы"
        );
        break;
      case UserRole.ADMIN:
        buttons.push(
          "Добавить модератора",
          "Просмотреть список модераторов",
          "Удалить модератора"
        );
    }

    const menu = Markup.keyboard(buttons).resize();
    return ctx.reply("Что вы хотите сделать?", menu);
  }

  /**
   * Launch bot
   */
  async launch() {
    await this.telegraf.launch();
    this.logger.log("info", `Launched bot ${this.telegraf.botInfo?.username}`);
  }
}
