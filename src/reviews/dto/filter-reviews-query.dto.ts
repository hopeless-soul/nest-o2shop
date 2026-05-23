import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ReviewStatus } from '../enums/review-status.enum';

export class FilterReviewsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsEnum(ReviewStatus) status?: ReviewStatus;
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsString() search?: string;
}
