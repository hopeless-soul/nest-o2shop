import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ReviewStatus } from '../enums/review-status.enum';

export class FilterReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID() productId?: string;

  @ApiPropertyOptional({ enum: ReviewStatus, enumName: 'ReviewStatus' })
  @IsOptional() @IsEnum(ReviewStatus) status?: ReviewStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID() userId?: string;

  @ApiPropertyOptional({ example: 'great quality' })
  @IsOptional() @IsString() search?: string;
}
