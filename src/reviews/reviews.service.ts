import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { CurrentUserData } from '../auth/types';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async create(
    productId: string,
    dto: CreateReviewDto,
    currentUser?: CurrentUserData,
  ): Promise<Review> {
    const review = this.reviewRepo.create({
      ...dto,
      productId,
      userId: currentUser?.id,
    });
    return this.reviewRepo.save(review);
  }

  async updateStatus(id: string, dto: UpdateReviewStatusDto): Promise<Review> {
    const review = await this.findByIdOrThrow(id);
    review.status = dto.status;
    return this.reviewRepo.save(review);
  }

  async remove(id: string, currentUser: CurrentUserData): Promise<void> {
    const review = await this.findByIdOrThrow(id);

    if (currentUser.role !== Role.ADMIN && review.userId !== currentUser.id) {
      throw new ForbiddenException("Cannot delete another user's review");
    }

    await this.reviewRepo.remove(review);
  }

  private async findByIdOrThrow(id: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Review #${id} not found`);
    return review;
  }
}
