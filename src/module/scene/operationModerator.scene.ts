import { Scenes } from "telegraf";
import IContext from "../../interface/context/context.interface";
import UserEntity from "../../entity/user.entity";

const OperationModerScene = new Scenes.BaseScene<IContext>("OPERATION_MODER");


OperationModerScene.enter((ctx: IContext) => {
  const operation = ctx.scene.state?.operation;
  const userRepo = ctx.bot.db.getRepository(UserEntity);
  ctx.reply('Введите его id')
})

OperationModerScene.on('message', (ctx) => {

})

export default OperationModerScene;
