/// <reference types="multer" />
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { AdminFilterProductsQueryDto } from './dto/admin-filter-products-query.dto';
import { FilterReviewsQueryDto } from '../reviews/dto/filter-reviews-query.dto';
import { AdminProductResponseDto } from './dto/product-response.dto';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';
import { ProductPhotoResponseDto } from './dto/product-photo-response.dto';
import { AdminReviewResponseDto } from '../reviews/dto/review-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Controller('admin/products')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query() query: AdminFilterProductsQueryDto,
  ): Promise<PaginatedResponseDto<AdminProductResponseDto>> {
    const result = await this.productsService.findAll(query, true);
    return {
      data: result.data.map((p) =>
        plainToInstance(AdminProductResponseDto, p, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AdminProductResponseDto> {
    const product = await this.productsService.findByIdAdmin(id);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<AdminProductResponseDto> {
    const product = await this.productsService.create(dto);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<AdminProductResponseDto> {
    const product = await this.productsService.update(id, dto);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string): Promise<void> {
    await this.productsService.softDelete(id);
  }

  @Post(':id/variants')
  async createVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.productsService.createVariant(id, dto);
    return plainToInstance(ProductVariantResponseDto, variant, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/variants/:variantId')
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.productsService.updateVariant(
      id,
      variantId,
      dto,
    );
    return plainToInstance(ProductVariantResponseDto, variant, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    await this.productsService.deleteVariant(id, variantId);
  }

  @Post(':id/variants/:variantId/default')
  async setDefaultVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ): Promise<AdminProductResponseDto> {
    const product = await this.productsService.setDefaultVariant(id, variantId);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  async addPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('altText') altText?: string,
  ): Promise<ProductPhotoResponseDto> {
    const photo = await this.productsService.addPhoto(id, file, altText);
    return plainToInstance(ProductPhotoResponseDto, photo, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<void> {
    await this.productsService.deletePhoto(id, photoId);
  }

  @Get(':productId/reviews')
  async findReviews(
    @Param('productId') productId: string,
    @Query() query: FilterReviewsQueryDto,
  ): Promise<PaginatedResponseDto<AdminReviewResponseDto>> {
    const result = await this.productsService.findProductReviews(
      productId,
      query,
      true,
    );
    return {
      data: result.data.map((r) =>
        plainToInstance(AdminReviewResponseDto, r, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }
}
