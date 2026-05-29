import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuditAction } from '../enums/audit-action.enum';

export class FilterAuditLogDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Product' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  changedBy?: string;

  @ApiPropertyOptional({ enum: AuditAction, enumName: 'AuditAction' })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ example: 'isPublished' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
