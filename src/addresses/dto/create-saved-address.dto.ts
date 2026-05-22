import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './address.dto';

export class CreateSavedAddressDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress: AddressDto;

  @IsOptional()
  @IsBoolean()
  billingIsSameAsShipping?: boolean;
}
