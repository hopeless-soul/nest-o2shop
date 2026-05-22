import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { SubCategory } from './entities/subcategory.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepo: Repository<SubCategory>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ relations: { subCategories: true } });
  }

  async findById(id: string): Promise<Category> {
    const cat = await this.categoryRepo.findOne({
      where: { id },
      relations: { subCategories: true },
    });
    if (!cat) throw new NotFoundException(`Category #${id} not found`);
    return cat;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug already taken');
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<Category> {
    const cat = await this.findById(id);
    Object.assign(cat, dto);
    return this.categoryRepo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const cat = await this.findById(id);
    await this.categoryRepo.remove(cat);
  }

  findSubCategories(categoryId: string): Promise<SubCategory[]> {
    return this.subCategoryRepo.find({ where: { categoryId } });
  }

  async createSubCategory(
    categoryId: string,
    dto: CreateSubCategoryDto,
  ): Promise<SubCategory> {
    await this.findById(categoryId);
    const existing = await this.subCategoryRepo.findOne({
      where: { slug: dto.slug, categoryId },
    });
    if (existing)
      throw new ConflictException('Slug already taken in this category');
    return this.subCategoryRepo.save(
      this.subCategoryRepo.create({ ...dto, categoryId }),
    );
  }

  async updateSubCategory(
    categoryId: string,
    subId: string,
    dto: Partial<CreateSubCategoryDto>,
  ): Promise<SubCategory> {
    const sub = await this.subCategoryRepo.findOne({
      where: { id: subId, categoryId },
    });
    if (!sub) throw new NotFoundException(`SubCategory #${subId} not found`);
    Object.assign(sub, dto);
    return this.subCategoryRepo.save(sub);
  }

  async removeSubCategory(categoryId: string, subId: string): Promise<void> {
    const sub = await this.subCategoryRepo.findOne({
      where: { id: subId, categoryId },
    });
    if (!sub) throw new NotFoundException(`SubCategory #${subId} not found`);
    await this.subCategoryRepo.remove(sub);
  }
}
