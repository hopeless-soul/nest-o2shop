import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AuditAction } from '../enums/audit-action.enum';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Product' })
  @Expose()
  entityType: string;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  entityId: string;

  @ApiProperty({ enum: AuditAction, enumName: 'AuditAction' })
  @Expose()
  action: AuditAction;

  @ApiPropertyOptional({ nullable: true, example: 'isPublished' })
  @Expose()
  field: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  fromValue: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  toValue: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  @Expose()
  changedBy: string | null;

  @ApiProperty()
  @Expose()
  changedAt: Date;
}
