import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export default class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
