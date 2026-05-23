import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ShippingService } from './shipping.service';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { ShippingMethodResponseDto } from './dto/shipping-method-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('admin/shipping-methods')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminShippingController {
  constructor(private readonly shippingService: ShippingService) {}

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

  @Post()
  async create(
    @Body() dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    const method = await this.shippingService.create(dto);
    return plainToInstance(ShippingMethodResponseDto, method, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    const method = await this.shippingService.update(id, dto);
    return plainToInstance(ShippingMethodResponseDto, method, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.shippingService.remove(id);
  }
}
