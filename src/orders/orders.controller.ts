import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { CurrentUserData } from '../auth/types';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({
    summary: 'Place a new order',
    description:
      'Works for both guest and authenticated users. Provide guestEmail for guest checkout.',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
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

  @ApiOperation({ summary: 'Look up an order by order number' })
  @ApiParam({ name: 'orderNumber', example: 'ORD-20240101-0001' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
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
