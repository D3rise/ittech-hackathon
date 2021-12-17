import Joi from "joi";

export default interface IArgument {
  name: string;
  description: string;
  validator: Joi.Schema;
}
