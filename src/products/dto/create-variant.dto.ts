import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  mainPhotoId?: string;
}
