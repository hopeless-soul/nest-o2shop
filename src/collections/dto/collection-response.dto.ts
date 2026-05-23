import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CollectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'summer-2025' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'Summer 2025' })
  @Expose()
  displayName: string;

  @ApiPropertyOptional({ example: 'Our summer collection' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ example: '/uploads/summer-banner.jpg' })
  @Expose()
  bannerImageUrl?: string;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

export class AdminCollectionResponseDto extends CollectionResponseDto {}
