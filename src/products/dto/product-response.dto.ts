import { Expose, Type } from 'class-transformer';
import { ProductPhotoResponseDto } from './product-photo-response.dto';
import { ProductVariantResponseDto } from './product-variant-response.dto';
import type { ProductDescription } from '../types/description-block.type';

class CollectionSummaryDto {
  @Expose() id: string;
  @Expose() slug: string;
  @Expose() displayName: string;
}

class CategorySummaryDto {
  @Expose() id: string;
  @Expose() slug: string;
  @Expose() displayName: string;
}

class SubCategorySummaryDto {
  @Expose() id: string;
  @Expose() slug: string;
  @Expose() displayName: string;
}

export class ProductResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() displayName: string;
  @Expose() basePrice: number;
  @Expose() currency: string;
  @Expose() description: ProductDescription;
  @Expose() rating?: number | null;
  @Expose()
  @Type(() => ProductPhotoResponseDto)
  photos: ProductPhotoResponseDto[];
  @Expose()
  @Type(() => ProductVariantResponseDto)
  defaultVariant?: ProductVariantResponseDto;
  @Expose()
  @Type(() => ProductVariantResponseDto)
  variants: ProductVariantResponseDto[];
  @Expose() @Type(() => CollectionSummaryDto) collection?: CollectionSummaryDto;
  @Expose() @Type(() => CategorySummaryDto) category: CategorySummaryDto;
  @Expose()
  @Type(() => SubCategorySummaryDto)
  subCategory: SubCategorySummaryDto;
}

export class AdminProductResponseDto extends ProductResponseDto {
  @Expose() isPublished: boolean;
  @Expose() deletedAt: Date | null;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
