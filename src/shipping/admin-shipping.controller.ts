import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ShippingService } from './shipping.service';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { ShippingMethodResponseDto } from './dto/shipping-method-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('Admin – Shipping')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/shipping-methods')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @ApiOperation({ summary: 'List all shipping methods (including inactive)' })
  @ApiOkResponse({ type: PaginatedDto(ShippingMethodResponseDto) })
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ShippingMethodResponseDto>> {
    const all = await this.shippingService.findAll(false);
    const data = all.map((m) =>
      plainToInstance(ShippingMethodResponseDto, m, {
        excludeExtraneousValues: true,
      }),
    );
    return { data, total: data.length, page: query.page, limit: query.limit };
  }

  @ApiOperation({ summary: 'Create a shipping method' })
  @ApiBody({ type: CreateShippingMethodDto })
  @ApiCreatedResponse({ type: ShippingMethodResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @Post()
  async create(
    @Body() dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    const method = await this.shippingService.create(dto);
    return plainToInstance(ShippingMethodResponseDto, method, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update a shipping method' })
  @ApiParam({ name: 'id', description: 'Shipping method UUID' })
  @ApiBody({ type: CreateShippingMethodDto })
  @ApiOkResponse({ type: ShippingMethodResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Shipping method not found' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    const method = await this.shippingService.update(id, dto);
    return plainToInstance(ShippingMethodResponseDto, method, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete a shipping method' })
  @ApiParam({ name: 'id', description: 'Shipping method UUID' })
  @ApiNoContentResponse({ description: 'Shipping method deleted' })
  @ApiNotFoundResponse({ description: 'Shipping method not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.shippingService.remove(id);
  }
}
