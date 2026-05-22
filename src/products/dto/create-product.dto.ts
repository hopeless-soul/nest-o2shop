import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import type { ProductDescription } from '../types/description-block.type';

export class CreateProductDto {
  @IsString()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'name must be lowercase alphanumeric with underscores',
  })
  name: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsString()
  categoryId: string;

  @IsString()
  subCategoryId: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsObject()
  description: ProductDescription;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
