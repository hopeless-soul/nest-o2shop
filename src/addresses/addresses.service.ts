import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedAddress } from './entities/saved-address.entity';
import { CreateSavedAddressDto } from './dto/create-saved-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(SavedAddress)
    private readonly repo: Repository<SavedAddress>,
  ) {}

  findAllForUser(userId: string): Promise<SavedAddress[]> {
    return this.repo.find({ where: { userId } });
  }

  async create(
    userId: string,
    dto: CreateSavedAddressDto,
  ): Promise<SavedAddress> {
    return this.repo.save(this.repo.create({ ...dto, userId }));
  }

  async update(
    id: string,
    userId: string,
    dto: Partial<CreateSavedAddressDto>,
  ): Promise<SavedAddress> {
    const address = await this.findAndAuthorize(id, userId);
    Object.assign(address, dto);
    return this.repo.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findAndAuthorize(id, userId);
    await this.repo.remove(address);
  }

  private async findAndAuthorize(
    id: string,
    userId: string,
  ): Promise<SavedAddress> {
    const address = await this.repo.findOne({ where: { id } });
    if (!address) throw new NotFoundException(`Address #${id} not found`);
    if (address.userId !== userId)
      throw new ForbiddenException('Access denied');
    return address;
  }
}
