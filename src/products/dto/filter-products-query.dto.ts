import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FilterProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'summer-2025' })
  @IsOptional()
  @IsString()
  collectionSlug?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  collectionId?: string;

  @ApiPropertyOptional({ example: 'clothing' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 't-shirts' })
  @IsOptional()
  @IsString()
  subCategorySlug?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @ApiPropertyOptional({ example: 'blue widget' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ minimum: 0, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0, example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['createdAt', 'basePrice', 'name'] })
  @IsOptional()
  @IsIn(['createdAt', 'basePrice', 'name'])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Return only products with compareAtPrice set above basePrice' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onSale?: boolean;
}
