import IMiddleware from "../../interface/module/middleware/middleware.interface";
import IContext from "../../interface/context/context.interface";
import ICommand from "../../interface/module/command/command.interface";
import IArgument from "../../interface/module/command/argument.interface";

export default class ValidateMiddleware implements IMiddleware {
  exec(ctx: IContext, next: () => Promise<any>) {
    if (!ctx.bot?.commands) {
      return next();
    }

    const botCommand = ctx.bot.commands.find(
      (cmd: ICommand) => cmd.name === ctx.state.command
    );

    if (!botCommand) {
      return next();
    }

    let errorMessage = "**Errors:**\n";
    let errorCount = 0;

    botCommand.args.forEach((arg: IArgument, i: number) => {
      const rawArgument =
        ctx.state.args && ctx.state.args.length > i
          ? ctx.state.args[i]
          : undefined;

      const { error } = arg.validator.validate(rawArgument);

      if (error) {
        errorMessage += `\n**${++errorCount}\\.** ${error}`;
      }
    });

    if (errorCount > 0) {
      return ctx.replyWithMarkdownV2(errorMessage);
    }
    return next();
  }
}
