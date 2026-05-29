import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../enums/role.enum';

export class FilterUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'jane' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Role, enumName: 'Role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    example: false,
    description: 'Include soft-deleted users',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isDeleted?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}
