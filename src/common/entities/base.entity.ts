import { 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

/**
 * Base Entity containing common fields for all entities
 * All entities should extend this class to inherit:
 * - id: UUID primary key
 * - createdAt: Auto-generated creation timestamp
 * - updatedAt: Auto-updated modification timestamp
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ 
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP' 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt: Date;
}