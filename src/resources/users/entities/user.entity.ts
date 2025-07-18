import { Entity, Column, Unique, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Membership } from '../../memberships/entities/membership.entity';

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseInt(value, 10) : null),
    },
  })
  lastLogin: number | null;

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships: Membership[];
}
