import IContext from "../../interface/context/context.interface";
import ICommand from "../../interface/module/command/command.interface";

export default class StartCommand implements Pick<ICommand, "exec"> {
  exec(ctx: IContext) {
    return ctx.bot.mainMenu(ctx)
  }
}
