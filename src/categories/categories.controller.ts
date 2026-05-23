import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CategoriesService } from './categories.service';
import {
  CategoryResponseDto,
  SubCategoryResponseDto,
} from './dto/category-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'List all categories with their subcategories' })
  @ApiOkResponse({ type: PaginatedDto(CategoryResponseDto) })
  @Auth(AuthType.None)
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    const all = await this.categoriesService.findAll();
    const data = all.map((c) =>
      plainToInstance(CategoryResponseDto, c, {
        excludeExtraneousValues: true,
      }),
    );
    return { data, total: data.length, page: query.page, limit: query.limit };
  }

  @ApiOperation({ summary: 'Get a category by ID (includes subcategories)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Auth(AuthType.None)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findById(id);
    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'List subcategories for a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse({ type: PaginatedDto(SubCategoryResponseDto) })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Auth(AuthType.None)
  @Get(':id/subcategories')
  async findSubCategories(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<SubCategoryResponseDto>> {
    const all = await this.categoriesService.findSubCategories(id);
    const data = all.map((s) =>
      plainToInstance(SubCategoryResponseDto, s, {
        excludeExtraneousValues: true,
      }),
    );
    return { data, total: data.length, page: query.page, limit: query.limit };
  }
}
