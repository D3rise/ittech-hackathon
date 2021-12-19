import IAction from "../../interface/module/action/action.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize } from "telegraf";

export class RequestDocumentAction implements IAction {
  triggers = /^requestDocument.*$/g;

  async exec(ctx: IContext) {
    await ctx.answerCbQuery();

    const cbData = deunionize(ctx.callbackQuery)?.data;
    if (!cbData) return;

    const requestId = cbData.split(":").at(-1);
    if (!requestId) return;

    ctx.session.requestDocumentScene = {
      requestId,
      data: null,
    };
    return ctx.scene.enter("REQUEST_DOCUMENT");
  }
}
