import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductPhotoResponseDto } from './product-photo-response.dto';

export class QuantityRuleResponseDto {
  @ApiProperty({ example: 1 }) @Expose() min: number;
  @ApiPropertyOptional({ example: null, nullable: true }) @Expose() max: number | null;
  @ApiProperty({ example: 1 }) @Expose() increment: number;
}

export class ProductVariantResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Expose()
  productId: string;

  @ApiProperty({ example: 'Navy Blue' })
  @Expose()
  colorName: string;

  @ApiProperty({ example: '#001f5b' })
  @Expose()
  colorValue: string;

  @ApiProperty({ example: 'M' })
  @Expose()
  size: string;

  @ApiProperty({ example: 'BLU-M-001' })
  @Expose()
  sku: string;

  @ApiProperty({ example: 50 })
  @Expose()
  stock: number;

  @ApiProperty({ example: true })
  @Expose()
  available: boolean;

  @ApiPropertyOptional({ example: 34.99 })
  @Expose()
  priceOverride?: number;

  @ApiPropertyOptional({ example: 59.99, nullable: true })
  @Expose()
  compareAtPrice?: number | null;

  @ApiPropertyOptional({ example: 450, nullable: true, description: 'Weight in grams' })
  @Expose()
  weight?: number | null;

  @ApiProperty({ example: 'deny', enum: ['deny', 'continue'] })
  @Expose()
  inventoryPolicy: string;

  @ApiProperty({ type: () => QuantityRuleResponseDto })
  @Expose()
  @Type(() => QuantityRuleResponseDto)
  quantityRule: QuantityRuleResponseDto;

  @ApiPropertyOptional({ example: '9781234567897', nullable: true })
  @Expose()
  barcode?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @Expose()
  featuredImageId?: string;

  @ApiPropertyOptional({ type: () => ProductPhotoResponseDto })
  @Expose()
  @Type(() => ProductPhotoResponseDto)
  featuredImage?: ProductPhotoResponseDto;
}
