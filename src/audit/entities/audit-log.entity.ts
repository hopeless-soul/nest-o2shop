import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction } from '../enums/audit-action.enum';

@Index(['entityType', 'entityId'])
@Index(['changedBy'])
@Index(['changedAt'])
@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string;

  @Column('uuid')
  entityId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', nullable: true })
  field: string | null;

  @Column({ type: 'text', nullable: true })
  fromValue: string | null;

  @Column({ type: 'text', nullable: true })
  toValue: string | null;

  @Column({ type: 'uuid', nullable: true })
  changedBy: string | null;

  @CreateDateColumn()
  changedAt: Date;
}
