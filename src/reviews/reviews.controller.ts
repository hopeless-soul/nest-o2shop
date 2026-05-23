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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { PaginatedResponseDto, PaginatedDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { CurrentUserData } from '../auth/types';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'List approved reviews for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiOkResponse({ type: PaginatedDto(ReviewResponseDto) })
  @ApiNotFoundResponse({ description: 'Product not found' })
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

  @ApiOperation({ summary: 'Submit a review for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiBody({ type: CreateReviewDto })
  @ApiCreatedResponse({ type: ReviewResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
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

  @ApiBearerAuth('access_token')
  @ApiOperation({ summary: 'Delete your own review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiNoContentResponse({ description: 'Review deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'Not the review owner' })
  @ApiNotFoundResponse({ description: 'Review not found' })
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
