import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { FilterProductsQueryDto } from './filter-products-query.dto';

export class AdminFilterProductsQueryDto extends FilterProductsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}
