import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../enums/review-status.enum';

export class ReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose() id: string;

  @ApiProperty({ format: 'uuid' })
  @Expose() productId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Expose() userId?: string;

  @ApiProperty({ example: 'Jane D.' })
  @Expose() displayName: string;

  @ApiProperty({ minimum: 1, maximum: 10, example: 8 })
  @Expose() rating: number;

  @ApiProperty({ example: 'Great quality, fast shipping!' })
  @Expose() content: string;

  @ApiPropertyOptional({ type: [String], example: ['https://example.com/photo.jpg'] })
  @Expose() photoUrls?: string[];

  @ApiProperty()
  @Expose() createdAt: Date;
}

export class AdminReviewResponseDto extends ReviewResponseDto {
  @ApiProperty({ example: 'user@example.com' })
  @Expose() email: string;

  @ApiProperty({ enum: ReviewStatus, enumName: 'ReviewStatus' })
  @Expose() status: ReviewStatus;

  @ApiProperty()
  @Expose() updatedAt: Date;
}
