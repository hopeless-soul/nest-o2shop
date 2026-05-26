import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProductDescription } from '../types/description-block.type';

const ProductDescriptionSchema = {
  type: 'object',
  required: ['blocks'],
  properties: {
    blocks: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['type', 'content'],
            properties: {
              type: { type: 'string', enum: ['text'] },
              content: { type: 'string', example: 'This is a paragraph.' },
            },
          },
          {
            type: 'object',
            required: ['type', 'items'],
            properties: {
              type: { type: 'string', enum: ['points'] },
              items: {
                type: 'array',
                items: { type: 'string' },
                example: ['Feature one', 'Feature two'],
              },
            },
          },
        ],
      },
    },
  },
};

export class CreateProductDto {
  @ApiProperty({
    example: 'blue_widget',
    pattern: '^[a-z0-9_]+$',
    description: 'Unique URL-safe identifier (lowercase, underscores)',
  })
  @IsString()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'name must be lowercase alphanumeric with underscores',
  })
  name: string;

  @ApiProperty({ example: 'Blue Widget' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID of the collection to assign',
  })
  @IsOptional()
  @IsString()
  collectionId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsString()
  categoryId: string;

  @ApiProperty({ format: 'uuid' })
  @IsString()
  subCategoryId: string;

  @ApiProperty({ minimum: 0, example: 29.99 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ minimum: 0, example: 34.99, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ minLength: 3, maxLength: 3, example: 'USD' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty(ProductDescriptionSchema as any)
  @IsObject()
  description: ProductDescription;

  @ApiPropertyOptional({ default: false, example: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['sale', 'new-arrival'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ nullable: true, example: 'Ushanka' })
  @IsOptional()
  @IsString()
  type?: string;
}
