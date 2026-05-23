import { Controller, Get, Param, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CategoriesService } from './categories.service';
import {
  CategoryResponseDto,
  SubCategoryResponseDto,
} from './dto/category-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

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

  @Auth(AuthType.None)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findById(id);
    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

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
