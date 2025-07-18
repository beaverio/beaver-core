import { BaseEntity } from "../../../common/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity('accounts')
export class Account extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;
}