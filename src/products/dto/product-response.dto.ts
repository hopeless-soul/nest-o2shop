import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductPhotoResponseDto } from './product-photo-response.dto';
import { ProductVariantResponseDto } from './product-variant-response.dto';
import type { ProductDescription } from '../types/description-block.type';

export class ProductPhotoSummaryDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty() @Expose() url: string;
  @ApiPropertyOptional() @Expose() altText?: string;
}

const ProductDescriptionSchema = {
  type: 'object',
  required: ['blocks'],
  properties: {
    blocks: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'content'],
            properties: {
              type: { type: 'string', enum: ['text'] },
              content: { type: 'string', example: 'This is a paragraph.' },
            },
          },
          {
            type: 'object',
            required: ['type', 'items'],
            properties: {
              type: { type: 'string', enum: ['points'] },
              items: {
                type: 'array',
                items: { type: 'string' },
                example: ['Feature one', 'Feature two'],
              },
            },
          },
        ],
      },
    },
  },
};

export class CollectionSummaryDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 'summer-2025' }) @Expose() slug: string;
  @ApiProperty({ example: 'Summer 2025' }) @Expose() displayName: string;
}

export class CategorySummaryDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 'clothing' }) @Expose() slug: string;
  @ApiProperty({ example: 'Clothing' }) @Expose() displayName: string;
}

export class SubCategorySummaryDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 't-shirts' }) @Expose() slug: string;
  @ApiProperty({ example: 'T-Shirts' }) @Expose() displayName: string;
}

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'blue_widget' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Blue Widget' })
  @Expose()
  displayName: string;

  @ApiProperty({ example: 29.99 })
  @Expose()
  basePrice: number;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currency: string;

  @ApiProperty(ProductDescriptionSchema as any)
  @Expose()
  description: ProductDescription;

  @ApiPropertyOptional({ nullable: true, example: 4.5 })
  @Expose()
  rating?: number | null;

  @ApiPropertyOptional({ type: () => ProductPhotoSummaryDto, nullable: true })
  @Expose()
  @Type(() => ProductPhotoSummaryDto)
  primaryPhoto: ProductPhotoSummaryDto | null;

  @ApiPropertyOptional({ type: () => ProductPhotoSummaryDto, nullable: true })
  @Expose()
  @Type(() => ProductPhotoSummaryDto)
  secondaryPhoto: ProductPhotoSummaryDto | null;

  @ApiProperty({ type: () => ProductPhotoResponseDto, isArray: true })
  @Expose()
  @Type(() => ProductPhotoResponseDto)
  photos: ProductPhotoResponseDto[];

  @ApiPropertyOptional({ type: () => ProductVariantResponseDto })
  @Expose()
  @Type(() => ProductVariantResponseDto)
  defaultVariant?: ProductVariantResponseDto;

  @ApiProperty({ type: () => ProductVariantResponseDto, isArray: true })
  @Expose()
  @Type(() => ProductVariantResponseDto)
  variants: ProductVariantResponseDto[];

  @ApiPropertyOptional({ type: () => CollectionSummaryDto })
  @Expose()
  @Type(() => CollectionSummaryDto)
  collection?: CollectionSummaryDto;

  @ApiProperty({ type: () => CategorySummaryDto })
  @Expose()
  @Type(() => CategorySummaryDto)
  category: CategorySummaryDto;

  @ApiProperty({ type: () => SubCategorySummaryDto })
  @Expose()
  @Type(() => SubCategorySummaryDto)
  subCategory: SubCategorySummaryDto;
}

export class AdminProductResponseDto extends ProductResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  isPublished: boolean;

  @ApiPropertyOptional({ nullable: true, example: null })
  @Expose()
  deletedAt: Date | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

export class ProductListItemResponseDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 'blue_widget' }) @Expose() name: string;
  @ApiProperty({ example: 'Blue Widget' }) @Expose() displayName: string;
  @ApiProperty({ example: 29.99 }) @Expose() basePrice: number;
  @ApiProperty({ example: 'USD' }) @Expose() currency: string;

  @ApiPropertyOptional({ nullable: true, example: 4.5 })
  @Expose()
  rating?: number | null;

  @ApiPropertyOptional({ type: () => ProductPhotoSummaryDto, nullable: true })
  @Expose()
  @Type(() => ProductPhotoSummaryDto)
  primaryPhoto: ProductPhotoSummaryDto | null;

  @ApiPropertyOptional({ type: () => ProductPhotoSummaryDto, nullable: true })
  @Expose()
  @Type(() => ProductPhotoSummaryDto)
  secondaryPhoto: ProductPhotoSummaryDto | null;

  @ApiPropertyOptional({ type: () => ProductVariantResponseDto })
  @Expose()
  @Type(() => ProductVariantResponseDto)
  defaultVariant?: ProductVariantResponseDto;

  @ApiProperty({ type: () => ProductVariantResponseDto, isArray: true })
  @Expose()
  @Type(() => ProductVariantResponseDto)
  variants: ProductVariantResponseDto[];

  @ApiPropertyOptional({ type: () => CollectionSummaryDto })
  @Expose()
  @Type(() => CollectionSummaryDto)
  collection?: CollectionSummaryDto;

  @ApiProperty({ type: () => CategorySummaryDto })
  @Expose()
  @Type(() => CategorySummaryDto)
  category: CategorySummaryDto;

  @ApiProperty({ type: () => SubCategorySummaryDto })
  @Expose()
  @Type(() => SubCategorySummaryDto)
  subCategory: SubCategorySummaryDto;
}
