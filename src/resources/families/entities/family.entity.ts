import { BaseEntity } from '../../../common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Membership } from '../../memberships/entities/membership.entity';

@Entity('families')
export class Family extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @OneToMany(() => Membership, (membership) => membership.family)
  memberships: Membership[];
}