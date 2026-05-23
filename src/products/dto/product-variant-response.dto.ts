import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductPhotoResponseDto } from './product-photo-response.dto';

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

  @ApiPropertyOptional({ example: 34.99 })
  @Expose()
  priceOverride?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @Expose()
  mainPhotoId?: string;

  @ApiPropertyOptional({ type: () => ProductPhotoResponseDto })
  @Expose()
  @Type(() => ProductPhotoResponseDto)
  mainPhoto?: ProductPhotoResponseDto;
}
