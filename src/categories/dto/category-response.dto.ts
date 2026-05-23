import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubCategoryResponseDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 't-shirts' }) @Expose() slug: string;
  @ApiProperty({ example: 'T-Shirts' }) @Expose() displayName: string;
  @ApiProperty({ format: 'uuid' }) @Expose() categoryId: string;
}

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid' }) @Expose() id: string;
  @ApiProperty({ example: 'clothing' }) @Expose() slug: string;
  @ApiProperty({ example: 'Clothing' }) @Expose() displayName: string;
  @ApiProperty({ type: () => SubCategoryResponseDto, isArray: true })
  @Expose()
  @Type(() => SubCategoryResponseDto)
  subCategories: SubCategoryResponseDto[];
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;
}
