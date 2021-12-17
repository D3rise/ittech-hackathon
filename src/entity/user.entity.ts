import { Column, Entity } from "typeorm";
import BaseEntity from "./base.entity";

export enum UserRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
}

@Entity()
export default class UserEntity extends BaseEntity {
  @Column({ unique: true })
  telegramId: number;

  @Column({ type: "enum", enum: UserRole, default: "user" })
  role: UserRole;
}
