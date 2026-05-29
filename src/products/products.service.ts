/// <reference types="multer" />
import { randomUUID } from 'crypto';
import { extname } from 'path';
import sharp from 'sharp';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductPhoto } from './entities/product-photo.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { ReorderPhotoItemDto } from './dto/reorder-photos.dto';
import { StorageService } from '../common/storage/storage.service';
import { ReviewStatus } from '../reviews/enums/review-status.enum';
import { FilterProductsQueryDto } from './dto/filter-products-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { FilterReviewsQueryDto } from '../reviews/dto/filter-reviews-query.dto';
import { Review } from '../reviews/entities/review.entity';
import { Paginated } from '../common/dto/paginated-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductPhoto)
    private readonly photoRepo: Repository<ProductPhoto>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(
    query: FilterProductsQueryDto,
    isAdmin = false,
  ): Promise<Paginated<Product>> {
    const {
      page,
      limit,
      collectionSlug,
      collectionId,
      categorySlug,
      categoryId,
      subCategorySlug,
      subCategoryId,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.defaultVariant', 'defaultVariant')
      .leftJoinAndSelect('defaultVariant.featuredImage', 'defaultVariantPhoto')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.featuredImage', 'variantPhoto')
      .leftJoinAndSelect('product.primaryPhoto', 'primaryPhoto')
      .leftJoinAndSelect('product.featuredPhoto', 'featuredPhoto')
      .leftJoinAndSelect('product.photos', 'photos')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.collection', 'collection');

    if (!isAdmin) {
      qb.where('product.isPublished = true');
    }

    if (collectionId) {
      qb.andWhere('product.collectionId = :collectionId', { collectionId });
    } else if (collectionSlug) {
      qb.andWhere('collection.slug = :collectionSlug', { collectionSlug });
    }

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    } else if (categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug });
    }

    if (subCategoryId) {
      qb.andWhere('product.subCategoryId = :subCategoryId', { subCategoryId });
    } else if (subCategorySlug) {
      qb.andWhere('subCategory.slug = :subCategorySlug', { subCategorySlug });
    }

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.displayName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.basePrice >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('product.basePrice <= :maxPrice', { maxPrice });
    }

    const sortColumn =
      sortBy === 'basePrice' ? 'product.basePrice' : `product.${sortBy}`;
    qb.orderBy(sortColumn, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    if (isAdmin) {
      qb.withDeleted();
    }

    const [data, total] = await qb.getManyAndCount();
    const ratingMap = await this.computeRatings(data.map((p) => p.id));
    for (const product of data) {
      this.attachComputedFields(product);
      (product as any).rating = ratingMap.get(product.id) ?? null;
    }
    return { data, total };
  }

  async findByName(
    name: string,
    isAdmin = false,
  ): Promise<Product & { rating: number | null }> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.defaultVariant', 'defaultVariant')
      .leftJoinAndSelect('defaultVariant.featuredImage', 'defaultVariantPhoto')
      .leftJoinAndSelect('product.primaryPhoto', 'primaryPhoto')
      .leftJoinAndSelect('product.featuredPhoto', 'featuredPhoto')
      .leftJoinAndSelect('product.photos', 'photos')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.featuredImage', 'variantPhoto')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.collection', 'collection')
      .where('product.name = :name', { name });

    if (!isAdmin) {
      qb.andWhere('product.isPublished = true');
    } else {
      qb.withDeleted();
    }

    const product = await qb.getOne();
    if (!product) throw new NotFoundException(`Product "${name}" not found`);

    this.attachComputedFields(product);
    const rating = await this.computeRating(product.id);
    return { ...product, rating };
  }

  async findByIdAdmin(
    id: string,
  ): Promise<Product & { rating: number | null }> {
    const product = await this.productRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        defaultVariant: { featuredImage: true },
        primaryPhoto: true,
        featuredPhoto: true,
        photos: true,
        variants: { featuredImage: true },
        category: true,
        subCategory: true,
        collection: true,
      },
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    this.attachComputedFields(product);
    const rating = await this.computeRating(product.id);
    return { ...product, rating };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Product name already taken');
    return this.productRepo.save(this.productRepo.create(dto));
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    const { primaryPhotoId, ...rest } = dto;
    Object.assign(product, rest);

    if (primaryPhotoId !== undefined) {
      if (primaryPhotoId === null) {
        product.primaryPhotoId = null;
      } else {
        const photo = await this.photoRepo.findOne({
          where: { id: primaryPhotoId, productId: id },
        });
        if (!photo)
          throw new NotFoundException(
            `Photo ${primaryPhotoId} not found on this product`,
          );
        product.primaryPhotoId = primaryPhotoId;
      }
    }

    return this.productRepo.save(product);
  }

  async softDelete(id: string): Promise<void> {
    const product = await this.findById(id);
    product.deletedAt = new Date();
    await this.productRepo.save(product);
  }

  async createVariant(
    productId: string,
    dto: CreateVariantDto,
  ): Promise<ProductVariant> {
    const product = await this.findById(productId);
    const sku =
      dto.sku ?? this.generateSku(product.name, dto.colorName, dto.size);

    const existing = await this.variantRepo.findOne({ where: { sku } });
    if (existing) throw new ConflictException(`SKU "${sku}" already exists`);

    return this.variantRepo.save(
      this.variantRepo.create({ ...dto, sku, productId }),
    );
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.findVariantOrThrow(productId, variantId);
    Object.assign(variant, dto);
    return this.variantRepo.save(variant);
  }

  async deleteVariant(productId: string, variantId: string): Promise<void> {
    const variant = await this.findVariantOrThrow(productId, variantId);
    await this.variantRepo.remove(variant);
  }

  async setDefaultVariant(
    productId: string,
    variantId: string,
  ): Promise<Product> {
    const product = await this.findById(productId);
    await this.findVariantOrThrow(productId, variantId);
    product.defaultVariantId = variantId;
    return this.productRepo.save(product);
  }

  async addPhoto(
    productId: string,
    file: Express.Multer.File,
    altText?: string,
  ): Promise<ProductPhoto> {
    await this.findById(productId);
    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const subPath = `products/${productId}/${randomUUID()}${ext}`;
    const url = await this.storageService.save(file, subPath);

    let width: number | null = null;
    let height: number | null = null;
    let aspectRatio: number | null = null;

    if (file.buffer) {
      try {
        const meta = await sharp(file.buffer).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
        aspectRatio =
          meta.width && meta.height
            ? parseFloat((meta.width / meta.height).toFixed(4))
            : null;
      } catch {
        // dimensions remain null if sharp cannot parse the file
      }
    }

    return this.photoRepo.save(
      this.photoRepo.create({ productId, url, altText, width, height, aspectRatio }),
    );
  }

  async deletePhoto(productId: string, photoId: string): Promise<void> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, productId },
    });
    if (!photo) throw new NotFoundException(`Photo #${photoId} not found`);
    await this.storageService.delete(photo.url);
    await this.photoRepo.remove(photo);
  }

  async setFeaturedPhoto(
    productId: string,
    file: Express.Multer.File,
    altText?: string,
  ): Promise<ProductPhoto> {
    const product = await this.findById(productId);

    if (product.featuredPhotoId) {
      const existing = await this.photoRepo.findOne({
        where: { id: product.featuredPhotoId },
      });
      if (existing) {
        await this.storageService.delete(existing.url);
        await this.photoRepo.remove(existing);
      }
    }

    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const subPath = `products/${productId}/featured/${randomUUID()}${ext}`;
    const url = await this.storageService.save(file, subPath);

    let width: number | null = null;
    let height: number | null = null;
    let aspectRatio: number | null = null;

    if (file.buffer) {
      try {
        const meta = await sharp(file.buffer).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
        aspectRatio =
          meta.width && meta.height
            ? parseFloat((meta.width / meta.height).toFixed(4))
            : null;
      } catch {
        // dimensions remain null if sharp cannot parse the file
      }
    }

    const photo = await this.photoRepo.save(
      this.photoRepo.create({ productId, url, altText, width, height, aspectRatio, isFeatured: true }),
    );

    product.featuredPhotoId = photo.id;
    await this.productRepo.save(product);

    return photo;
  }

  async deleteFeaturedPhoto(productId: string): Promise<void> {
    const product = await this.findById(productId);
    if (!product.featuredPhotoId) {
      throw new NotFoundException('No featured photo set for this product');
    }
    const photo = await this.photoRepo.findOne({
      where: { id: product.featuredPhotoId },
    });
    if (photo) {
      await this.storageService.delete(photo.url);
      await this.photoRepo.remove(photo);
    }
    product.featuredPhotoId = null;
    await this.productRepo.save(product);
  }

  async updatePhoto(
    productId: string,
    photoId: string,
    dto: UpdatePhotoDto,
  ): Promise<ProductPhoto> {
    const photo = await this.photoRepo.findOne({
      where: { id: photoId, productId },
    });
    if (!photo) throw new NotFoundException(`Photo #${photoId} not found`);
    Object.assign(photo, dto);
    return this.photoRepo.save(photo);
  }

  async reorderPhotos(
    productId: string,
    items: ReorderPhotoItemDto[],
  ): Promise<ProductPhoto[]> {
    await this.findById(productId);
    const ids = items.map((i) => i.id);
    const photos = await this.photoRepo.find({
      where: { id: In(ids), productId },
    });
    if (photos.length !== ids.length) {
      throw new NotFoundException(
        'One or more photos not found on this product',
      );
    }
    const photoMap = new Map(photos.map((p) => [p.id, p]));
    for (const item of items) {
      photoMap.get(item.id)!.sortOrder = item.sortOrder;
    }
    return this.photoRepo.save(photos);
  }

  async findProductReviews(
    productId: string,
    query: PaginationQueryDto,
    isAdmin = false,
  ): Promise<Paginated<Review>> {
    const { page, limit } = query;
    const qb = this.reviewRepo
      .createQueryBuilder('review')
      .where('review.productId = :productId', { productId });

    if (!isAdmin) {
      qb.andWhere('review.status = :status', { status: ReviewStatus.APPROVED });
    }

    if (isAdmin) {
      const filterQuery = query as FilterReviewsQueryDto;
      if (filterQuery.status) {
        qb.andWhere('review.status = :status', { status: filterQuery.status });
      }
      if (filterQuery.userId) {
        qb.andWhere('review.userId = :userId', { userId: filterQuery.userId });
      }
    }

    qb.orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async computeRating(productId: string): Promise<number | null> {
    const result = await this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.reviews', 'review', 'review.status = :status', {
        status: ReviewStatus.APPROVED,
      })
      .select('AVG(review.rating)', 'avg')
      .where('product.id = :productId', { productId })
      .getRawOne<{ avg: string | null }>();

    return result?.avg != null ? parseFloat(result.avg) : null;
  }

  private async computeRatings(
    productIds: string[],
  ): Promise<Map<string, number | null>> {
    if (productIds.length === 0) return new Map();

    const rows = await this.reviewRepo
      .createQueryBuilder('review')
      .select('review.productId', 'productId')
      .addSelect('AVG(review.rating)', 'avg')
      .where('review.productId IN (:...productIds)', { productIds })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .groupBy('review.productId')
      .getRawMany<{ productId: string; avg: string | null }>();

    const map = new Map<string, number | null>(
      productIds.map((id) => [id, null]),
    );
    for (const row of rows) {
      map.set(row.productId, row.avg != null ? parseFloat(row.avg) : null);
    }
    return map;
  }

  private attachComputedFields(product: Product): void {
    const variants = product.variants ?? [];

    // Per-variant available flag
    for (const v of variants) {
      (v as any).available = v.stock > 0;
    }
    if (product.defaultVariant) {
      (product.defaultVariant as any).available =
        product.defaultVariant.stock > 0;
    }

    // Product-level pricing and availability
    const prices =
      variants.length > 0
        ? variants.map((v) => v.priceOverride ?? product.basePrice)
        : [product.basePrice];
    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);

    (product as any).available = variants.some((v) => v.stock > 0);
    (product as any).priceMin = priceMin;
    (product as any).priceMax = priceMax;
    (product as any).priceVaries = priceMin !== priceMax;

    // Options — group unique size values (and color if multi-color product)
    const sizes = [...new Set(variants.map((v) => v.size))];
    const colors = [...new Set(variants.map((v) => v.colorName))];
    const options: { name: string; position: number; values: string[] }[] = [];
    if (sizes.length > 0) options.push({ name: 'Size', position: 1, values: sizes });
    if (colors.length > 1) options.push({ name: 'Color', position: 2, values: colors });
    (product as any).options = options;

    // Exclude featured photo from the gallery array
    if (product.photos) {
      product.photos = product.photos.filter((p) => !p.isFeatured);
    }

    // variantIds reverse lookup on photos (only when full photos array is loaded)
    if (product.photos?.length) {
      const map = new Map<string, string[]>();
      for (const v of variants) {
        if (v.featuredImageId) {
          const ids = map.get(v.featuredImageId) ?? [];
          ids.push(v.id);
          map.set(v.featuredImageId, ids);
        }
      }
      for (const p of product.photos) {
        p.variantIds = map.get(p.id) ?? [];
      }
    }
  }

  private generateSku(
    productName: string,
    colorName: string,
    size: string,
  ): string {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `${normalize(productName)}-${normalize(colorName)}-${normalize(size)}`;
  }

  private async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  private async findVariantOrThrow(
    productId: string,
    variantId: string,
  ): Promise<ProductVariant> {
    const variant = await this.variantRepo.findOne({
      where: { id: variantId, productId },
    });
    if (!variant)
      throw new NotFoundException(`Variant #${variantId} not found`);
    return variant;
  }
}
