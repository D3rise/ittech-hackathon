import { Column, Entity, ManyToOne } from "typeorm";
import BaseEntity from "./base.entity";
import RequestEntity from "./request.entity";

@Entity()
export default class PendingDocumentEntity extends BaseEntity {
  @ManyToOne(() => RequestEntity, (req) => req.pendingDocuments)
  request: RequestEntity;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;
}
