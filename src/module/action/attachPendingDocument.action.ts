import IAction from "../../interface/module/action/action.interface";
import IContext from "../../interface/context/context.interface";
import PendingDocumentEntity from "../../entity/pendingDocument.entity";
import { deunionize } from "telegraf";

export default class AttachPendingDocumentAction implements IAction {
  triggers = /attachPendingDocument:.*/g;

  async exec(ctx: IContext) {
    await ctx.answerCbQuery();

    const cbQuery = deunionize(ctx.callbackQuery);
    const data = cbQuery?.data;
    if (!data) return;

    const pendingDocumentId = data.split(":").at(-1);
    const pendingDocumentsRepo = ctx.bot.db.getRepository(
      PendingDocumentEntity
    );
    const pendingDocument = await pendingDocumentsRepo.findOne(
      pendingDocumentId
    );
    if (!pendingDocument) return;

    ctx.session.addPendingDocumentScene = {
      data: null,
      docId: pendingDocumentId,
      docName: pendingDocument.name,
      docDescription: pendingDocument.description,
    };
    ctx.scene.enter("ADD_PENDING_DOCUMENT");
  }
}
