import { Expose, Type } from 'class-transformer';

class AddressResponseDto {
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() company?: string;
  @Expose() address1: string;
  @Expose() address2?: string;
  @Expose() city: string;
  @Expose() country: string;
  @Expose() province: string;
  @Expose() postalCode: string;
  @Expose() phone: string;
}

export class SavedAddressResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() @Type(() => AddressResponseDto) shippingAddress: AddressResponseDto;
  @Expose() @Type(() => AddressResponseDto) billingAddress: AddressResponseDto;
  @Expose() billingIsSameAsShipping: boolean;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
