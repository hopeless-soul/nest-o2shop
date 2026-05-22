import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Auth(AuthType.None)
  @Post('products/:productId/reviews')
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.reviewsService.create(productId, dto, user);
  }

  @Auth(AuthType.Bearer)
  @Delete('reviews/:id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.reviewsService.remove(id, user);
  }

  @Roles(Role.ADMIN)
  @Patch('reviews/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) {
    return this.reviewsService.updateStatus(id, dto);
  }
}
