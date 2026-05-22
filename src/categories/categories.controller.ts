import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Auth(AuthType.None)
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Auth(AuthType.None)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Auth(AuthType.None)
  @Get(':id/subcategories')
  findSubCategories(@Param('id') id: string) {
    return this.categoriesService.findSubCategories(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/subcategories')
  createSubCategory(
    @Param('id') id: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.categoriesService.createSubCategory(id, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/subcategories/:subId')
  updateSubCategory(
    @Param('id') id: string,
    @Param('subId') subId: string,
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.categoriesService.updateSubCategory(id, subId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/subcategories/:subId')
  removeSubCategory(@Param('id') id: string, @Param('subId') subId: string) {
    return this.categoriesService.removeSubCategory(id, subId);
  }
}
