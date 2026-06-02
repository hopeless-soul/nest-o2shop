import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { OrdersService } from './orders.service';
import { FilterOrdersQueryDto } from './dto/filter-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { AdminOrderResponseDto } from './dto/order-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('Admin – Orders')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/orders')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'List all orders with filters' })
  @ApiOkResponse({ type: PaginatedDto(AdminOrderResponseDto) })
  @Get()
  async findAll(
    @Query() query: FilterOrdersQueryDto,
  ): Promise<PaginatedResponseDto<AdminOrderResponseDto>> {
    const result = await this.ordersService.findAllAdmin(query);
    return {
      data: result.data.map((o) =>
        plainToInstance(AdminOrderResponseDto, o, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @ApiOperation({ summary: 'Get an order by ID (admin view)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ type: AdminOrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminOrderResponseDto> {
    const order = await this.ordersService.findByIdAdmin(id);
    return plainToInstance(AdminOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update payment or fulfillment status of an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiOkResponse({ type: AdminOrderResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<AdminOrderResponseDto> {
    const order = await this.ordersService.updateStatus(id, dto);
    return plainToInstance(AdminOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update recipient info (email, name, addresses) of an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: UpdateRecipientDto })
  @ApiOkResponse({ type: AdminOrderResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @Patch(':id/recipient')
  async updateRecipient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecipientDto,
  ): Promise<AdminOrderResponseDto> {
    const order = await this.ordersService.updateRecipient(id, dto);
    return plainToInstance(AdminOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Get all notes for an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ schema: { properties: { notes: { type: 'array', items: { type: 'string' } } } } })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @Get(':id/notes')
  async getNotes(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ notes: string[] }> {
    const notes = await this.ordersService.getNotes(id);
    return { notes };
  }

  @ApiOperation({ summary: 'Append a note to an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: AddNoteDto })
  @ApiCreatedResponse({ schema: { properties: { notes: { type: 'array', items: { type: 'string' } } } } })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @Post(':id/notes')
  async addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddNoteDto,
  ): Promise<{ notes: string[] }> {
    const notes = await this.ordersService.addNote(id, dto);
    return { notes };
  }
}
