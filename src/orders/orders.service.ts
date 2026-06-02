import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { FilterOrdersQueryDto } from './dto/filter-orders-query.dto';
import { ShippingService } from '../shipping/shipping.service';
import { CurrentUserData } from '../auth/types';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Paginated } from '../common/dto/paginated-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly shippingService: ShippingService,
  ) {}

  async create(
    dto: CreateOrderDto,
    currentUser?: CurrentUserData,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const variantRepo = manager.getRepository(ProductVariant);

      const shippingMethod = await this.shippingService.findById(
        dto.shippingMethodId,
      );

      const variantSkus = dto.items.map((i) => i.variantSku);
      const variants = await variantRepo
        .createQueryBuilder('v')
        .innerJoinAndSelect('v.product', 'p')
        .where('v.sku IN (:...skus)', { skus: variantSkus })
        .setLock('pessimistic_write')
        .getMany();

      const variantMap = new Map(variants.map((v) => [v.sku, v]));

      for (const item of dto.items) {
        const variant = variantMap.get(item.variantSku);
        if (!variant)
          throw new NotFoundException(
            `Variant with SKU "${item.variantSku}" not found`,
          );
        if (variant.stock < item.quantity)
          throw new BadRequestException(
            `Insufficient stock for SKU "${item.variantSku}"`,
          );
        variant.stock -= item.quantity;
      }

      await variantRepo.save([...variantMap.values()]);

      const last = await orderRepo.findOne({
        where: {},
        order: { orderSequence: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      const seq = (last?.orderSequence ?? 0) + 1;
      const orderNumber = `O2SHOP-${String(seq).padStart(6, '0')}`;

      const orderItems: Partial<OrderItem>[] = dto.items.map((item) => {
        const variant = variantMap.get(item.variantSku)!;
        const unitPrice = Number(
          variant.priceOverride ?? variant.product.basePrice,
        );
        return {
          productId: variant.productId,
          productName: variant.product.displayName,
          productSku: variant.sku,
          productPrice: unitPrice,
          productCurrency: variant.product.currency,
          quantity: item.quantity,
          total: unitPrice * item.quantity,
        };
      });

      const totalAmount = orderItems.reduce(
        (sum, i) => sum + (i.total ?? 0),
        0,
      );

      const order = orderRepo.create({
        orderNumber,
        orderSequence: seq,
        userId: currentUser?.id,
        email: currentUser ? undefined : dto.email,
        firstName: currentUser ? undefined : dto.firstName,
        lastName: currentUser ? undefined : dto.lastName,
        paymentStatus: undefined,
        fulfillmentStatus: undefined,
        totalAmount,
        totalCurrency: shippingMethod.currency,
        shippingMethodId: shippingMethod.id,
        shippingMethodName: shippingMethod.name,
        shippingPrice: Number(shippingMethod.price),
        shippingCurrency: shippingMethod.currency,
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingIsSameAsShipping
          ? dto.shippingAddress
          : dto.billingAddress,
        items: orderItems as OrderItem[],
      });

      return orderRepo.save(order);
    });
  }

  async findAllAdmin(query: FilterOrdersQueryDto): Promise<Paginated<Order>> {
    const {
      page,
      limit,
      userId,
      email,
      paymentStatus,
      fulfillmentStatus,
      createdAfter,
      createdBefore,
    } = query;

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user');

    if (userId) qb.andWhere('order.userId = :userId', { userId });
    if (email)
      qb.andWhere('order.email ILIKE :email', {
        email: `%${email}%`,
      });
    if (paymentStatus)
      qb.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    if (fulfillmentStatus)
      qb.andWhere('order.fulfillmentStatus = :fulfillmentStatus', {
        fulfillmentStatus,
      });
    if (createdAfter)
      qb.andWhere('order.createdAt >= :createdAfter', { createdAfter });
    if (createdBefore)
      qb.andWhere('order.createdAt <= :createdBefore', { createdBefore });

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findMine(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<Order>> {
    const { page, limit } = query;
    const [data, total] = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { orderNumber },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException(`Order "${orderNumber}" not found`);
    return order;
  }

  async findByIdAdmin(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true, user: true },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    Object.assign(order, dto);
    return this.orderRepo.save(order);
  }

  async updateRecipient(id: string, dto: UpdateRecipientDto): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true, user: true },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);

    if (dto.email !== undefined && dto.email !== order.email) {
      const user = await this.userRepo.findOne({ where: { email: dto.email } });
      order.userId = user?.id ?? undefined;
      order.user = user ?? undefined;
      order.email = dto.email;
    }

    if (dto.firstName !== undefined) order.firstName = dto.firstName;
    if (dto.lastName !== undefined) order.lastName = dto.lastName;
    if (dto.shippingAddress !== undefined) order.shippingAddress = dto.shippingAddress;
    if (dto.billingAddress !== undefined) order.billingAddress = dto.billingAddress;

    return this.orderRepo.save(order);
  }

  async getNotes(id: string): Promise<string[]> {
    const order = await this.orderRepo.findOne({ where: { id }, select: { id: true, notes: true } });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order.notes;
  }

  async addNote(id: string, dto: AddNoteDto): Promise<string[]> {
    const order = await this.orderRepo.findOne({ where: { id }, select: { id: true, notes: true } });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    order.notes = [...order.notes, dto.note];
    await this.orderRepo.save(order);
    return order.notes;
  }
}
