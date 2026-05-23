import { Expose } from 'class-transformer';
import { ReviewStatus } from '../enums/review-status.enum';

export class ReviewResponseDto {
  @Expose() id: string;
  @Expose() productId: string;
  @Expose() userId?: string;
  @Expose() displayName: string;
  @Expose() rating: number;
  @Expose() content: string;
  @Expose() photoUrls?: string[];
  @Expose() createdAt: Date;
}

export class AdminReviewResponseDto extends ReviewResponseDto {
  @Expose() email: string;
  @Expose() status: ReviewStatus;
  @Expose() updatedAt: Date;
}
