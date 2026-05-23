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
import { ReviewStatus } from './enums/review-status.enum';
import { FilterReviewsQueryDto } from './dto/filter-reviews-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

export interface Paginated<T> {
  data: T[];
  total: number;
}

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

  async findByProduct(
    productId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<Review>> {
    const { page, limit } = query;
    const [data, total] = await this.reviewRepo
      .createQueryBuilder('review')
      .where('review.productId = :productId', { productId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findAllAdmin(query: FilterReviewsQueryDto): Promise<Paginated<Review>> {
    const { page, limit, productId, status, userId, search } = query;

    const qb = this.reviewRepo.createQueryBuilder('review');

    if (productId) {
      qb.andWhere('review.productId = :productId', { productId });
    }
    if (status) {
      qb.andWhere('review.status = :status', { status });
    }
    if (userId) {
      qb.andWhere('review.userId = :userId', { userId });
    }
    if (search) {
      qb.andWhere(
        '(review.displayName ILIKE :search OR review.content ILIKE :search OR review.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
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

  async removeAdmin(id: string): Promise<void> {
    const review = await this.findByIdOrThrow(id);
    await this.reviewRepo.remove(review);
  }

  private async findByIdOrThrow(id: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Review #${id} not found`);
    return review;
  }
}
