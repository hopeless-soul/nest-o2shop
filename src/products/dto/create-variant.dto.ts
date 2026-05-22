import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Matches,
} from 'class-validator';

export class CreateVariantDto {
  @IsString()
  colorName: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'colorValue must be a hex color' })
  colorValue: string;

  @IsString()
  size: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @IsOptional()
  @IsString()
  mainPhotoId?: string;
}
