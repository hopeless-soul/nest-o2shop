import { Controller, Get, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ShippingService } from './shipping.service';
import { ShippingMethodResponseDto } from './dto/shipping-method-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@Controller('shipping-methods')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Auth(AuthType.None)
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ShippingMethodResponseDto>> {
    const all = await this.shippingService.findAll(true);
    const data = all.map((m) =>
      plainToInstance(ShippingMethodResponseDto, m, {
        excludeExtraneousValues: true,
      }),
    );
    return { data, total: data.length, page: query.page, limit: query.limit };
  }
}
