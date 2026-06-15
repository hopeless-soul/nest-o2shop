/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { extname } from 'path';
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
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';
import { AdminFilterProductsQueryDto } from './dto/admin-filter-products-query.dto';
import { FilterReviewsQueryDto } from '../reviews/dto/filter-reviews-query.dto';
import {
  AdminProductResponseDto,
  AdminProductListItemResponseDto,
  PaginatedAdminProductListItemResponseDto,
} from './dto/product-response.dto';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';
import { ProductPhotoResponseDto } from './dto/product-photo-response.dto';
import { AdminReviewResponseDto } from '../reviews/dto/review-response.dto';
import {
  PaginatedResponseDto,
  PaginatedDto,
} from '../common/dto/paginated-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const imageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) => {
  cb(
    null,
    ALLOWED_IMAGE_EXTS.includes(extname(file.originalname).toLowerCase()),
  );
};

@ApiTags('Admin – Products')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/products')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'List all products (with admin-only filters)' })
  @ApiOkResponse({ type: PaginatedAdminProductListItemResponseDto })
  @Get()
  async findAll(
    @Query() query: AdminFilterProductsQueryDto,
  ): Promise<PaginatedAdminProductListItemResponseDto> {
    const result = await this.productsService.findAll(query, true);
    return {
      data: result.data.map((p) =>
        plainToInstance(AdminProductListItemResponseDto, p, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  @ApiOperation({ summary: 'Get a product by ID (admin view with all fields)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({ type: AdminProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminProductResponseDto> {
    const product = await this.productsService.findByIdAdmin(id);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({ type: AdminProductResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @Post()
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<AdminProductResponseDto> {
    const product = await this.productsService.create(dto);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ type: AdminProductResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<AdminProductResponseDto> {
    const product = await this.productsService.update(id, dto);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.productsService.softDelete(id);
  }

  @ApiOperation({ summary: 'Add a variant to a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ type: CreateVariantDto })
  @ApiCreatedResponse({ type: ProductVariantResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Post(':id/variants')
  async createVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.productsService.createVariant(id, dto);
    return plainToInstance(ProductVariantResponseDto, variant, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update a product variant' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  @ApiBody({ type: UpdateVariantDto })
  @ApiOkResponse({ type: ProductVariantResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Product or variant not found' })
  @Patch(':id/variants/:variantId')
  async updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
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

  @ApiOperation({ summary: 'Delete a product variant' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  @ApiNoContentResponse({ description: 'Variant deleted' })
  @ApiNotFoundResponse({ description: 'Product or variant not found' })
  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<void> {
    await this.productsService.deleteVariant(id, variantId);
  }

  @ApiOperation({ summary: 'Set the default variant for a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiParam({
    name: 'variantId',
    description: 'Variant UUID to set as default',
  })
  @ApiOkResponse({ type: AdminProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product or variant not found' })
  @Post(':id/variants/:variantId/default')
  async setDefaultVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<AdminProductResponseDto> {
    const product = await this.productsService.setDefaultVariant(id, variantId);
    return plainToInstance(AdminProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Upload a photo for a product' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiQuery({
    name: 'altText',
    required: false,
    description: 'Alt text for the image',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Display order of the photo (0-based integer)',
    schema: { type: 'integer', minimum: 0 },
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP)',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ProductPhotoResponseDto })
  @Post(':id/photos')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  async addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('altText') altText?: string,
    @Query('sortOrder', new ParseIntPipe({ optional: true }))
    sortOrder?: number,
  ): Promise<ProductPhotoResponseDto> {
    if (!file) throw new BadRequestException('No valid image file provided');
    const photo = await this.productsService.addPhoto(
      id,
      file,
      altText,
      sortOrder,
    );
    return plainToInstance(ProductPhotoResponseDto, photo, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({
    summary: 'Upload or replace the featured (brand) photo for a product',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiQuery({
    name: 'altText',
    required: false,
    description: 'Alt text for the featured image',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, GIF; max 5MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ProductPhotoResponseDto })
  @Post(':id/featured-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  async setFeaturedPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('altText') altText?: string,
  ): Promise<ProductPhotoResponseDto> {
    if (!file) throw new BadRequestException('No valid image file provided');
    const photo = await this.productsService.setFeaturedPhoto(
      id,
      file,
      altText,
    );
    return plainToInstance(ProductPhotoResponseDto, photo, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete the featured (brand) photo for a product' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiNoContentResponse({ description: 'Featured photo deleted' })
  @ApiNotFoundResponse({ description: 'No featured photo set' })
  @Delete(':id/featured-photo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFeaturedPhoto(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.productsService.deleteFeaturedPhoto(id);
  }

  @ApiOperation({ summary: 'Batch-reorder photos by setting sortOrder' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ type: ReorderPhotosDto })
  @ApiOkResponse({ type: [ProductPhotoResponseDto] })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Product or photo not found' })
  @Patch(':id/photos/reorder')
  async reorderPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderPhotosDto,
  ): Promise<ProductPhotoResponseDto[]> {
    const photos = await this.productsService.reorderPhotos(id, dto.photos);
    return photos.map((p) =>
      plainToInstance(ProductPhotoResponseDto, p, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @ApiOperation({ summary: 'Update photo metadata (altText, sortOrder)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiParam({ name: 'photoId', description: 'Photo UUID' })
  @ApiBody({ type: UpdatePhotoDto })
  @ApiOkResponse({ type: ProductPhotoResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Photo not found' })
  @Patch(':id/photos/:photoId')
  async updatePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @Body() dto: UpdatePhotoDto,
  ): Promise<ProductPhotoResponseDto> {
    const photo = await this.productsService.updatePhoto(id, photoId, dto);
    return plainToInstance(ProductPhotoResponseDto, photo, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete a product photo' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiParam({ name: 'photoId', description: 'Photo UUID' })
  @ApiNoContentResponse({ description: 'Photo deleted' })
  @ApiNotFoundResponse({ description: 'Photo not found' })
  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ): Promise<void> {
    await this.productsService.deletePhoto(id, photoId);
  }

  @ApiOperation({
    summary: 'List all reviews for a product (admin view, all statuses)',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiOkResponse({ type: PaginatedDto(AdminReviewResponseDto) })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Get(':productId/reviews')
  async findReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
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
