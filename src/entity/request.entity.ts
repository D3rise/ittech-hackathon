import BaseEntity from "./base.entity";
import UserEntity from "./user.entity";
import { Column, ManyToOne } from "typeorm";

export enum RequestStatus {
  PROCESSING = "processing",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  DOCS_PENDING = "docs_pending",
}

export default class RequestEntity extends BaseEntity {
  @ManyToOne(() => UserEntity)
  author: UserEntity;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column()
  middlename: string;

  @Column()
  telephone: string;

  @Column()
  documents: string[];

  @Column({ type: "enum", enum: RequestStatus })
  status: RequestStatus;

  @Column()
  statusMessage: string;
}
