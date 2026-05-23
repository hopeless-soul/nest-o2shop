import { Expose, Type } from 'class-transformer';

export class SubCategoryResponseDto {
  @Expose() id: string;
  @Expose() slug: string;
  @Expose() displayName: string;
  @Expose() categoryId: string;
}

export class CategoryResponseDto {
  @Expose() id: string;
  @Expose() slug: string;
  @Expose() displayName: string;
  @Expose()
  @Type(() => SubCategoryResponseDto)
  subCategories: SubCategoryResponseDto[];
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
