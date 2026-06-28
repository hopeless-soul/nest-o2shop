import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
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
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { FilterReviewsQueryDto } from './dto/filter-reviews-query.dto';
import { AdminReviewResponseDto } from './dto/review-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { SkipThrottle } from '@nestjs/throttler';

// Admin backoffice — exempt from rate limiting
@SkipThrottle()
@ApiTags('Admin – Reviews')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/reviews')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'List all reviews with filters (all statuses)' })
  @ApiOkResponse({ type: PaginatedDto(AdminReviewResponseDto) })
  @Get()
  async findAll(
    @Query() query: FilterReviewsQueryDto,
  ): Promise<PaginatedResponseDto<AdminReviewResponseDto>> {
    const result = await this.reviewsService.findAllAdmin(query);
    return {
      data: result.data.map((r) =>
        plainToInstance(AdminReviewResponseDto, r, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @ApiOperation({ summary: 'Approve or reject a review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiBody({ type: UpdateReviewStatusDto })
  @ApiOkResponse({ type: AdminReviewResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewStatusDto,
  ): Promise<AdminReviewResponseDto> {
    const review = await this.reviewsService.updateStatus(id, dto);
    return plainToInstance(AdminReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Hard-delete a review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiNoContentResponse({ description: 'Review deleted' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.reviewsService.removeAdmin(id);
  }
}
