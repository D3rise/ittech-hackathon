import { Column, Entity, OneToMany } from "typeorm";
import BaseEntity from "./base.entity";
import RequestEntity from "./request.entity";

export enum UserRole {
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
}

@Entity()
export default class UserEntity extends BaseEntity {
  @Column({ unique: true })
  telegramId: number;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @OneToMany(() => RequestEntity, (req) => req.author)
  requests: RequestEntity[];
}
