import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FilterProductsQueryDto } from './filter-products-query.dto';

export class AdminFilterProductsQueryDto extends FilterProductsQueryDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Filter by published state',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Include soft-deleted products',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}
