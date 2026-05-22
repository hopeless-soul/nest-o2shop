import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingMethod } from './entities/shipping-method.entity';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(ShippingMethod)
    private readonly repo: Repository<ShippingMethod>,
  ) {}

  findAll(activeOnly = true): Promise<ShippingMethod[]> {
    return activeOnly
      ? this.repo.find({ where: { isActive: true } })
      : this.repo.find();
  }

  async findById(id: string): Promise<ShippingMethod> {
    const method = await this.repo.findOne({ where: { id } });
    if (!method) throw new NotFoundException(`ShippingMethod #${id} not found`);
    return method;
  }

  create(dto: CreateShippingMethodDto): Promise<ShippingMethod> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(
    id: string,
    dto: Partial<CreateShippingMethodDto>,
  ): Promise<ShippingMethod> {
    const method = await this.findById(id);
    Object.assign(method, dto);
    return this.repo.save(method);
  }

  async remove(id: string): Promise<void> {
    const method = await this.findById(id);
    await this.repo.remove(method);
  }
}
