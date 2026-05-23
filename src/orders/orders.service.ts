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
import { FilterOrdersQueryDto } from './dto/filter-orders-query.dto';
import { ShippingService } from '../shipping/shipping.service';
import { CurrentUserData } from '../auth/types';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

export interface Paginated<T> {
  data: T[];
  total: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
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
        guestEmail: currentUser ? undefined : dto.guestEmail,
        guestFirstName: currentUser ? undefined : dto.guestFirstName,
        guestLastName: currentUser ? undefined : dto.guestLastName,
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
      guestEmail,
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
    if (guestEmail)
      qb.andWhere('order.guestEmail ILIKE :guestEmail', {
        guestEmail: `%${guestEmail}%`,
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
}
