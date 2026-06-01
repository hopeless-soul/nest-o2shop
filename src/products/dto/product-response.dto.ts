import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductPhotoResponseDto } from './product-photo-response.dto';
import { ProductVariantResponseDto } from './product-variant-response.dto';
import type { ProductDescription } from '../types/description-block.type';
import { PaginatedDto } from '../../common/dto/paginated-response.dto';

export class ProductPhotoSummaryDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty() @Expose() url: string;
  @ApiPropertyOptional() @Expose() altText?: string;
  @ApiPropertyOptional({ example: 1200, nullable: true }) @Expose() width?: number | null;
  @ApiPropertyOptional({ example: 1500, nullable: true }) @Expose() height?: number | null;
  @ApiPropertyOptional({ example: 0.8, nullable: true }) @Expose() aspectRatio?: number | null;
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

export class ProductOptionDto {
  @ApiProperty({ example: 'Size' }) @Expose() name: string;
  @ApiProperty({ example: 1 }) @Expose() position: number;
  @ApiProperty({ type: [String], example: ['XS', 'S', 'M', 'L', 'XL'] }) @Expose() values: string[];
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

  @ApiProperty({ example: true })
  @Expose()
  available: boolean;

  @ApiProperty({ example: 29.99 })
  @Expose()
  priceMin: number;

  @ApiProperty({ example: 49.99 })
  @Expose()
  priceMax: number;

  @ApiProperty({ example: false })
  @Expose()
  priceVaries: boolean;

  @ApiPropertyOptional({ example: 34.99, nullable: true })
  @Expose()
  compareAtPrice?: number | null;

  @ApiProperty({ type: [String], example: ['sale', 'new-arrival'] })
  @Expose()
  tags: string[];

  @ApiPropertyOptional({ type: String, example: 'Ushanka' })
  @Expose()
  type?: string;

  @ApiProperty({ type: () => ProductOptionDto, isArray: true })
  @Expose()
  @Type(() => ProductOptionDto)
  options: ProductOptionDto[];

  @ApiProperty(ProductDescriptionSchema as any)
  @Expose()
  description: ProductDescription;

  @ApiPropertyOptional({ nullable: true, example: 4.5 })
  @Expose()
  rating?: number | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ type: () => ProductPhotoSummaryDto, nullable: true })
  @Expose()
  @Type(() => ProductPhotoSummaryDto)
  primaryPhoto: ProductPhotoSummaryDto | null;

  @ApiPropertyOptional({ type: () => ProductPhotoSummaryDto, nullable: true })
  @Expose()
  @Type(() => ProductPhotoSummaryDto)
  featuredPhoto: ProductPhotoSummaryDto | null;

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
  updatedAt: Date;
}

export class ProductListItemResponseDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 'blue_widget' }) @Expose() name: string;
  @ApiProperty({ example: 'Blue Widget' }) @Expose() displayName: string;
  @ApiProperty({ example: 29.99 }) @Expose() basePrice: number;
  @ApiProperty({ example: 'USD' }) @Expose() currency: string;

  @ApiProperty({ example: true }) @Expose() available: boolean;
  @ApiProperty({ example: 29.99 }) @Expose() priceMin: number;
  @ApiProperty({ example: 49.99 }) @Expose() priceMax: number;
  @ApiProperty({ example: false }) @Expose() priceVaries: boolean;

  @ApiPropertyOptional({ example: 34.99, nullable: true }) @Expose() compareAtPrice?: number | null;

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
  featuredPhoto: ProductPhotoSummaryDto | null;

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

  @ApiPropertyOptional({ nullable: true, example: 'Ushanka' })
  @Expose()
  type?: string;
}

export class AdminProductListItemResponseDto extends ProductListItemResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  isPublished: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true, example: null })
  @Expose()
  deletedAt: Date | null;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

export class PaginatedAdminProductListItemResponseDto extends PaginatedDto(AdminProductListItemResponseDto) {}
