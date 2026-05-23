import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Auth(AuthType.None)
  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user?: CurrentUserData,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(dto, user);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Auth(AuthType.None)
  @Get(':orderNumber')
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.findByOrderNumber(orderNumber);
    return plainToInstance(OrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }
}
