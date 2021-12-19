import BaseEntity from "./base.entity";
import UserEntity from "./user.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import DocumentEntity from "./document.entity";
import PendingDocumentEntity from "./pendingDocument.entity";

export enum RequestStatus {
  PROCESSING = "processing",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  DOCS_PENDING = "docs_pending",
}

@Entity()
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

  @OneToMany(() => DocumentEntity, (doc) => doc.request, {
    cascade: ["remove", "soft-remove"],
  })
  documents: DocumentEntity[];

  @OneToMany(() => PendingDocumentEntity, (doc) => doc.request, {
    cascade: ["remove", "soft-remove"],
  })
  pendingDocuments: PendingDocumentEntity[];

  @Column({
    type: "enum",
    enum: RequestStatus,
    default: RequestStatus.PROCESSING,
  })
  status: RequestStatus;

  @Column({ nullable: true })
  statusMessage: string;
}
