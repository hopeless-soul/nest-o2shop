import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FilterProductsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() collectionSlug?: string;
  @IsOptional() @IsString() collectionId?: string;
  @IsOptional() @IsString() categorySlug?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subCategorySlug?: string;
  @IsOptional() @IsString() subCategoryId?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsNumber() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @IsOptional() @IsIn(['createdAt', 'basePrice', 'name']) sortBy?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
}
