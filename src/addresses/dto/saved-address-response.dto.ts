import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AddressResponseDto {
  @ApiProperty({ example: 'Jane' }) @Expose() firstName: string;
  @ApiProperty({ example: 'Doe' }) @Expose() lastName: string;
  @ApiPropertyOptional({ example: 'Acme Corp' }) @Expose() company?: string;
  @ApiProperty({ example: '123 Main St' }) @Expose() address1: string;
  @ApiPropertyOptional({ example: 'Apt 4B' }) @Expose() address2?: string;
  @ApiProperty({ example: 'New York' }) @Expose() city: string;
  @ApiProperty({ example: 'US' }) @Expose() country: string;
  @ApiProperty({ example: 'NY' }) @Expose() province: string;
  @ApiProperty({ example: '10001' }) @Expose() postalCode: string;
  @ApiProperty({ example: '+1 555 000 0000' }) @Expose() phone: string;
}

export class SavedAddressResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Home' })
  @Expose()
  name: string;

  @ApiProperty({ type: () => AddressResponseDto })
  @Expose()
  @Type(() => AddressResponseDto)
  shippingAddress: AddressResponseDto;

  @ApiProperty({ type: () => AddressResponseDto })
  @Expose()
  @Type(() => AddressResponseDto)
  billingAddress: AddressResponseDto;

  @ApiProperty({ example: false })
  @Expose()
  billingIsSameAsShipping: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
