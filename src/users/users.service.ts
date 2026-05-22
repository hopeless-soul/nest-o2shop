import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, FindOneOptions, Repository } from 'typeorm';
import { CreateOAuthUserDto } from './dto/create-oauth-user.dto';
import { CreateLocalUserDto } from './dto/create-local-user.dto';
import { DataSource } from 'typeorm/browser';
import { HashingService } from '../common/hashing/hashing.service';
import { CurrentUserData, toCurrentUserData } from '../auth/types';

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
    console.log('createFromOAuth -->', dto);

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
        // handle race condition from unique constraint violation (e.g. two admins creating users with same email simultaneously)
        const pgUniqueViolationCode = '23505'; // Postgres 'unique' violation
        if (error?.code === pgUniqueViolationCode) {
          throw new ConflictException('Email or username already exists');
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
      `UPDATE "order" SET "userId" = $1, "guestEmail" = NULL WHERE "guestEmail" = $2`,
      [userId, email],
    );
    await manager.query(
      `UPDATE "review" SET "userId" = $1 WHERE "email" = $2 AND "userId" IS NULL`,
      [userId, email],
    );
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: any) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
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
