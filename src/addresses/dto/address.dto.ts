import { IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  address1: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsString()
  province: string;

  @IsString()
  postalCode: string;

  @IsString()
  phone: string;
}
