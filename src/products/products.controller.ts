/// <reference types="multer" />
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Auth(AuthType.None)
  @Get()
  findAll(@CurrentUser() user?: CurrentUserData) {
    return this.productsService.findAll(user?.role === Role.ADMIN);
  }

  @Auth(AuthType.None)
  @Get(':name')
  findOne(@Param('name') name: string, @CurrentUser() user?: CurrentUserData) {
    return this.productsService.findByName(name, user?.role === Role.ADMIN);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/variants')
  createVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.createVariant(id, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/variants/:variantId')
  updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productsService.updateVariant(id, variantId, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/variants/:variantId/default')
  setDefaultVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productsService.setDefaultVariant(id, variantId);
  }

  @Roles(Role.ADMIN)
  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  addPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('altText') altText?: string,
  ) {
    return this.productsService.addPhoto(id, file, altText);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/photos/:photoId')
  deletePhoto(@Param('id') id: string, @Param('photoId') photoId: string) {
    return this.productsService.deletePhoto(id, photoId);
  }
}
