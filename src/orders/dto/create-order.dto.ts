import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from '../../addresses/dto/address.dto';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestFirstName?: string;

  @IsOptional()
  @IsString()
  guestLastName?: string;

  @IsString()
  shippingMethodId: string;

  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @IsOptional()
  @IsBoolean()
  billingIsSameAsShipping?: boolean;

  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress: AddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
