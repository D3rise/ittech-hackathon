import IContext from "../../interface/context/context.interface";
import ICommand from "../../interface/module/command/command.interface";

//Вообще, исключение того или иного метода интерфейса (т.е. отказ от его реализации) является результатом плохой архитектуры и нарушением одного из принципов SOLID.
// I - принцип разделения интерфейса (interface segregation principle).
// В TS классы могут имплементировать несколько интерфейсов, а значит, вы можете разделить этот интерфейс на несколько подинтерфейсов и реализовать нужные.

export default class HelpCommand implements ICommand {
  name = "help";
  description = "Get list of command";
  args = [];

  exec(ctx: IContext) {
    const { commands } = ctx.bot;
    let res = "*List of available command:*";

    commands.forEach((command: ICommand, i: number) => {
      res += `\n**${i + 1}**\\. *${command.name}* \\- ${command.description}`;
    });

    ctx.replyWithMarkdownV2(res);
  }
}
