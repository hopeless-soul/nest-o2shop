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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import {
  CategoryResponseDto,
  SubCategoryResponseDto,
} from './dto/category-response.dto';
import { PaginatedResponseDto, PaginatedDto } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('Admin – Categories')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/categories')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'List all categories' })
  @ApiOkResponse({ type: PaginatedDto(CategoryResponseDto) })
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

  @ApiOperation({ summary: 'Create a category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @Post()
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.create(dto);
    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.update(id, dto);
    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiNoContentResponse({ description: 'Category deleted' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }

  @ApiOperation({ summary: 'Add a subcategory to a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiBody({ type: CreateSubCategoryDto })
  @ApiCreatedResponse({ type: SubCategoryResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @Post(':id/subcategories')
  async createSubCategory(
    @Param('id') id: string,
    @Body() dto: CreateSubCategoryDto,
  ): Promise<SubCategoryResponseDto> {
    const sub = await this.categoriesService.createSubCategory(id, dto);
    return plainToInstance(SubCategoryResponseDto, sub, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update a subcategory' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiParam({ name: 'subId', description: 'Subcategory UUID' })
  @ApiBody({ type: CreateSubCategoryDto })
  @ApiOkResponse({ type: SubCategoryResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Category or subcategory not found' })
  @Patch(':id/subcategories/:subId')
  async updateSubCategory(
    @Param('id') id: string,
    @Param('subId') subId: string,
    @Body() dto: CreateSubCategoryDto,
  ): Promise<SubCategoryResponseDto> {
    const sub = await this.categoriesService.updateSubCategory(id, subId, dto);
    return plainToInstance(SubCategoryResponseDto, sub, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete a subcategory' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiParam({ name: 'subId', description: 'Subcategory UUID' })
  @ApiNoContentResponse({ description: 'Subcategory deleted' })
  @ApiNotFoundResponse({ description: 'Category or subcategory not found' })
  @Delete(':id/subcategories/:subId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSubCategory(
    @Param('id') id: string,
    @Param('subId') subId: string,
  ): Promise<void> {
    await this.categoriesService.removeSubCategory(id, subId);
  }
}
