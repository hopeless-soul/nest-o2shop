import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuantityRuleDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  min: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  max?: number | null;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  increment: number;
}

export class CreateVariantDto {
  @ApiProperty({ example: 'Navy Blue' })
  @IsString()
  colorName: string;

  @ApiProperty({ example: '#001f5b', pattern: '^#[0-9A-Fa-f]{6}$' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'colorValue must be a hex color' })
  colorValue: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  size: string;

  @ApiPropertyOptional({ example: 'BLU-M-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ minimum: 0, example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ minimum: 0, example: 34.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @ApiPropertyOptional({ minimum: 0, example: 59.99, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ minimum: 0, example: 450, description: 'Weight in grams' })
  @IsOptional()
  @IsInt()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ type: () => QuantityRuleDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => QuantityRuleDto)
  quantityRule?: QuantityRuleDto;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  featuredImageId?: string;
}
