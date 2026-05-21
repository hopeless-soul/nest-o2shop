import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { CreateOAuthUserDto } from './dto/create-oauth-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  createFromOAuth(dto: CreateOAuthUserDto) {
    console.log('createFromOAuth -->', dto);
    
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  async findByEmail(email: string, options?: FindOneOptions<User>): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email }, ...options });
  }

  async findByEmailOrThrow(email: string, options?: FindOneOptions<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email }, ...options });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async findById(id: string, options?: FindOneOptions<User>): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id }, ...options });
  }

  async findByIdOrThrow(id: string, options?: FindOneOptions<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, ...options });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }
}
