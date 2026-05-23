import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

export interface Paginated<T> {
  data: T[];
  total: number;
}

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly repo: Repository<Collection>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
    isAdmin = false,
  ): Promise<Paginated<Collection>> {
    const { page, limit } = query;
    const qb = this.repo.createQueryBuilder('collection');

    if (!isAdmin) {
      qb.where('collection.isActive = true');
    }

    qb.orderBy('collection.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<Collection> {
    const collection = await this.repo.findOne({ where: { id } });
    if (!collection) throw new NotFoundException(`Collection #${id} not found`);
    return collection;
  }

  async create(dto: CreateCollectionDto): Promise<Collection> {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already taken');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateCollectionDto): Promise<Collection> {
    const collection = await this.findById(id);
    Object.assign(collection, dto);
    return this.repo.save(collection);
  }

  async remove(id: string): Promise<void> {
    const collection = await this.findById(id);
    await this.repo.remove(collection);
  }
}
