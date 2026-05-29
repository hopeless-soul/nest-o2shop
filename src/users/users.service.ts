import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, EntityManager, FindOneOptions, Repository } from 'typeorm';
import { CreateOAuthUserDto } from './dto/create-oauth-user.dto';
import { CreateLocalUserDto } from './dto/create-local-user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { HashingService } from '../common/hashing/hashing.service';
import { toCurrentUserData } from '../auth/types';
import { FilterUsersQueryDto } from './dto/filter-users-query.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { Paginated } from '../common/dto/paginated-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly hashingService: HashingService,
  ) {}

  createFromOAuth(dto: CreateOAuthUserDto) {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  createFromLocal(dto: CreateLocalUserDto) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const { email, password } = dto;

      const exists = await userRepo.findOne({ where: { email } });
      if (exists) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await this.hashingService.hash(password);
      const user = userRepo.create({ email, password: hashedPassword });

      try {
        const saved = await userRepo.save(user);
        await this.linkGuestData(saved.id, saved.email, manager);
        return toCurrentUserData(saved);
      } catch (error: any) {
        const pgUniqueViolationCode = '23505';
        if (error?.code === pgUniqueViolationCode) {
          throw new ConflictException('Email or username already exists');
        }
        throw error;
      }
    });
  }

  createFromAdmin(dto: CreateAdminUserDto) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const { email, password, displayName, avatarUrl, role, isActive } = dto;

      const exists = await userRepo.findOne({ where: { email } });
      if (exists) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await this.hashingService.hash(password);
      const user = userRepo.create({
        email,
        password: hashedPassword,
        ...(displayName !== undefined && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      });

      try {
        const saved = await userRepo.save(user);
        await this.linkGuestData(saved.id, saved.email, manager);
        return saved;
      } catch (error: any) {
        if (error?.code === '23505') {
          throw new ConflictException('Email already exists');
        }
        throw error;
      }
    });
  }

  private async linkGuestData(
    userId: string,
    email: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager.query(
      `UPDATE "order" SET "userId" = $1, "email" = NULL WHERE "email" = $2`,
      [userId, email],
    );
    await manager.query(
      `UPDATE "review" SET "userId" = $1 WHERE "email" = $2 AND "userId" IS NULL`,
      [userId, email],
    );
  }

  async findAllAdmin(query: FilterUsersQueryDto): Promise<Paginated<User>> {
    const {
      page,
      limit,
      search,
      role,
      isDeleted,
      isActive,
      userId,
      createdAfter,
      createdBefore,
    } = query;

    const qb = this.userRepository.createQueryBuilder('user');

    if (isDeleted) {
      qb.withDeleted().where('user.deletedAt IS NOT NULL');
    }

    if (isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive });
    }

    if (userId) {
      qb.andWhere('user.id = :userId', { userId });
    }
    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    if (search) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.displayName ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (createdAfter) {
      qb.andWhere('user.createdAt >= :createdAfter', { createdAfter });
    }
    if (createdBefore) {
      qb.andWhere('user.createdAt <= :createdBefore', { createdBefore });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findByIdAdmin(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async updateAdmin(id: string, dto: UpdateAdminUserDto): Promise<User> {
    const user = await this.findByIdAdmin(id);
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.resetTokenVersion) user.tokenVersion += 1;
    return this.userRepository.save(user);
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await this.userRepository.increment({ id }, 'tokenVersion', 1);
  }

  async softDeleteAdmin(id: string): Promise<void> {
    const user = await this.findByIdAdmin(id);
    user.deletedAt = new Date();
    await this.userRepository.save(user);
  }

  async findByEmail(
    email: string,
    options?: FindOneOptions<User>,
  ): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email }, ...options });
  }

  async findByEmailOrThrow(
    email: string,
    options?: FindOneOptions<User>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      ...options,
    });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findById(
    id: string,
    options?: FindOneOptions<User>,
  ): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id }, ...options });
  }

  async findByIdOrThrow(
    id: string,
    options?: FindOneOptions<User>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      ...options,
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }
}
