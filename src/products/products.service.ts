/// <reference types="multer" />
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductPhoto } from './entities/product-photo.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { StorageService } from '../common/storage/storage.service';
import { ReviewStatus } from '../reviews/enums/review-status.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductPhoto)
    private readonly photoRepo: Repository<ProductPhoto>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(isAdmin = false): Promise<Product[]> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.defaultVariant', 'defaultVariant')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory');

    if (!isAdmin) {
      qb.where('product.isPublished = true');
    }

    return qb.getMany();
  }

  async findByName(
    name: string,
    isAdmin = false,
  ): Promise<Product & { rating: number | null }> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.defaultVariant', 'defaultVariant')
      .leftJoinAndSelect('product.photos', 'photos')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.collection', 'collection')
      .where('product.name = :name', { name });

    if (!isAdmin) {
      qb.andWhere('product.isPublished = true');
    }

    const product = await qb.getOne();
    if (!product) throw new NotFoundException(`Product "${name}" not found`);

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
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.productRepo.softDelete(id);
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
    const subPath = `products/${productId}/${Date.now()}-${file.originalname}`;
    const url = await this.storageService.save(file, subPath);
    return this.photoRepo.save(
      this.photoRepo.create({ productId, url, altText }),
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
