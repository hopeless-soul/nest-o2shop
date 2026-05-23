import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Auth(AuthType.None)
  @Get('products/:productId/reviews')
  async findByProduct(
    @Param('productId') productId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const result = await this.reviewsService.findByProduct(productId, query);
    return {
      data: result.data.map((r) =>
        plainToInstance(ReviewResponseDto, r, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Auth(AuthType.None)
  @Post('products/:productId/reviews')
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user?: CurrentUserData,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.create(productId, dto, user);
    return plainToInstance(ReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @Auth(AuthType.Bearer)
  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    await this.reviewsService.remove(id, user);
  }
}
