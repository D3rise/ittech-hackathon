import BaseEntity from "./base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import RequestEntity from "./request.entity";

@Entity()
export default class DocumentEntity extends BaseEntity {
  @Column()
  fileName: string;

  @Column()
  minioId: string;

  @ManyToOne(() => RequestEntity, (req) => req.documents)
  request: RequestEntity;
}
