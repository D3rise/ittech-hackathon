import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";

export default class SendRequestHears implements IHears {
  triggers = "✈ Отправить заявку на поступление в колледж";

  exec(ctx: IContext) {
    return ctx.scene.enter("ADD_DOCUMENT");
  }
}
