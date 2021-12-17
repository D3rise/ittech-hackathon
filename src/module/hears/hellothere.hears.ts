import contextInterface from "../../interface/context/context.interface";
import IHears from "../../interface/module/hears/hears.interface";

export default class HelloThereHears implements IHears {
  triggers = "HELLO THERE";
  exec(ctx: contextInterface) {
    ctx.reply("hello hello!!");
  }
}
