import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Auth(AuthType.None)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: CurrentUserData) {
    return this.ordersService.create(dto, user);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Auth(AuthType.Bearer)
  @Get('my')
  findMine(@CurrentUser() user: CurrentUserData) {
    return this.ordersService.findMine(user.id);
  }

  @Auth(AuthType.None)
  @Get(':orderNumber')
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
