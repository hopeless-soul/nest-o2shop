import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { FilterProductsQueryDto } from './dto/filter-products-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({
    summary: 'List published products',
    description:
      'Browse the public product catalogue with optional filters for collection, category, price range, and sort order.',
  })
  @ApiOkResponse({ type: PaginatedDto(ProductResponseDto) })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
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

  @ApiOperation({
    summary: 'Get a product by slug',
    description:
      'Fetch a single published product by its URL slug, including all variants, photos, and category info.',
  })
  @ApiParam({ name: 'name', description: 'Product URL slug (e.g. oversized_hoodie)' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Auth(AuthType.None)
  @Get(':name')
  async findOne(@Param('name') name: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findByName(name, false);
    return plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }
}
