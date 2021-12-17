import IAction from "../../../interface/module/action/action.interface";
import IContext from "../../../interface/context/context.interface";

export default class HelloAction implements IAction {
  triggers = "hello";

  async exec(ctx: IContext, next: () => Promise<any>) {
    await ctx.reply("Hello!");
    await ctx.answerCbQuery();
  }
}
