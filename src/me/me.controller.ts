import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { AddressesService } from '../addresses/addresses.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { SavedAddressResponseDto } from '../addresses/dto/saved-address-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

@ApiTags('Me')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('me')
@Auth(AuthType.Bearer)
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly addressesService: AddressesService,
  ) {}

  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @Get()
  async getProfile(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserResponseDto> {
    const entity = await this.usersService.findByIdOrThrow(user.id);
    return plainToInstance(UserResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: "List the authenticated user's orders" })
  @ApiOkResponse({ type: PaginatedDto(OrderResponseDto) })
  @Get('orders')
  async getOrders(
    @CurrentUser() user: CurrentUserData,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const result = await this.ordersService.findMine(user.id, query);
    return {
      data: result.data.map((o) =>
        plainToInstance(OrderResponseDto, o, { excludeExtraneousValues: true }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @ApiOperation({ summary: "List the authenticated user's saved addresses" })
  @ApiOkResponse({ type: SavedAddressResponseDto, isArray: true })
  @Get('addresses')
  async getAddresses(
    @CurrentUser() user: CurrentUserData,
  ): Promise<SavedAddressResponseDto[]> {
    const list = await this.addressesService.findAllForUser(user.id);
    return list.map((a) =>
      plainToInstance(SavedAddressResponseDto, a, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
