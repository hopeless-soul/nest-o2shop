import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ReviewsService } from './reviews.service';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { FilterReviewsQueryDto } from './dto/filter-reviews-query.dto';
import { AdminReviewResponseDto } from './dto/review-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('admin/reviews')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

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

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
  ): Promise<AdminReviewResponseDto> {
    const review = await this.reviewsService.updateStatus(id, dto);
    return plainToInstance(AdminReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.reviewsService.removeAdmin(id);
  }
}
