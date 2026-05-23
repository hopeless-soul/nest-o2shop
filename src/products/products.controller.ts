import { Controller, Get, Param, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { FilterProductsQueryDto } from './dto/filter-products-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Auth(AuthType.None)
  @Get()
  async findAll(
    @Query() query: FilterProductsQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const result = await this.productsService.findAll(query, false);
    return {
      data: result.data.map((p) =>
        plainToInstance(ProductResponseDto, p, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Auth(AuthType.None)
  @Get(':name')
  async findOne(@Param('name') name: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findByName(name, false);
    return plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }
}
