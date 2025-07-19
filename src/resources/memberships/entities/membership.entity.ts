import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Family } from '../../families/entities/family.entity';

@Entity('memberships')
@Index(['userId', 'familyId'], { unique: true })
export class Membership extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  familyId: string;

  // Permissions array for this user on this family
  @Column({ type: 'simple-array' })
  permissions: string[];

  // Relations
  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Family, (family) => family.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'familyId' })
  family: Family;
}
