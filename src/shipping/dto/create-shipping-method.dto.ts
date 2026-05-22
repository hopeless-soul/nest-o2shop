import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateShippingMethodDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
