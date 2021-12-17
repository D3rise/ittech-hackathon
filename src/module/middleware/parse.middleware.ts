import IMiddleware from "../../interface/module/middleware/middleware.interface";
import IContext from "../../interface/context/context.interface";
import { deunionize } from "telegraf";

export default class ParseMiddleware implements IMiddleware {
  exec(ctx: IContext, next: () => Promise<any>): any {
    const messageText =
      ctx.updateType === "channel_post"
        ? deunionize(ctx.channelPost)?.text
        : deunionize(ctx.message)?.text;

    if (messageText) {
      const parts = messageText.split(" ");
      ctx.state.command = parts[0].slice(1);
      ctx.state.args = parts.slice(1);
    }

    return next();
  }
}
