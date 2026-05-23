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
}
