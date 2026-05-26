import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductPhotoResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: '/uploads/photo.jpg' })
  @Expose()
  url: string;

  @ApiPropertyOptional({ example: 'Front view of product' })
  @Expose()
  altText?: string;

  @ApiProperty({ example: 0 })
  @Expose()
  sortOrder: number;

  @ApiPropertyOptional({ example: 1200, nullable: true })
  @Expose()
  width?: number | null;

  @ApiPropertyOptional({ example: 1500, nullable: true })
  @Expose()
  height?: number | null;

  @ApiPropertyOptional({ example: 0.8, nullable: true })
  @Expose()
  aspectRatio?: number | null;

  @ApiPropertyOptional({ type: [String], example: [] })
  @Expose()
  variantIds?: string[];
}
