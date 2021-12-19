import IMiddleware from "../../interface/module/middleware/middleware.interface";
import IContext from "../../interface/context/context.interface";
import UserEntity from "../../entity/user.entity";

export default class UserMiddleware implements IMiddleware {
  async exec(ctx: IContext, next: () => any) {
    const userRepo = ctx.bot.db.getRepository(UserEntity);

    if (ctx.session.user || !ctx.from) return next();

    const user = await userRepo.findOne({
      where: { telegramId: ctx.from.id },
    });

    if (!user) {
      ctx.session.user = userRepo.create({ telegramId: String(ctx.from.id) });
      await userRepo.save(ctx.session.user);
      return next();
    }

    ctx.session.user = user;
    return next();
  }
}
