import Bot from "../../../bot";

export default interface ICustomEvent {
  triggers: string | symbol;
  exec(bot: Bot): any;
}
