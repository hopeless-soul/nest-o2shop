import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewStatus } from '../enums/review-status.enum';

export class UpdateReviewStatusDto {
  @ApiProperty({ enum: ReviewStatus, enumName: 'ReviewStatus', example: ReviewStatus.APPROVED })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;
}
