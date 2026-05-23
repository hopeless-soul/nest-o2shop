import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum';
import { OrderItemResponseDto } from './order-item-response.dto';

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

export class OrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'ORD-20240101-0001' })
  @Expose()
  orderNumber: string;

  @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
  @Expose()
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: FulfillmentStatus, enumName: 'FulfillmentStatus' })
  @Expose()
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty({ example: 65.97 })
  @Expose()
  totalAmount: number;

  @ApiProperty({ example: 'USD' })
  @Expose()
  totalCurrency: string;

  @ApiProperty({ example: 'Standard Shipping' })
  @Expose()
  shippingMethodName: string;

  @ApiProperty({ example: 5.99 })
  @Expose()
  shippingPrice: number;

  @ApiProperty({ example: 'USD' })
  @Expose()
  shippingCurrency: string;

  @ApiProperty({ type: () => AddressResponseDto })
  @Expose()
  @Type(() => AddressResponseDto)
  shippingAddress: AddressResponseDto;

  @ApiProperty({ type: () => AddressResponseDto })
  @Expose()
  @Type(() => AddressResponseDto)
  billingAddress: AddressResponseDto;

  @ApiProperty({ type: () => OrderItemResponseDto, isArray: true })
  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;
}

export class AdminOrderResponseDto extends OrderResponseDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @Expose()
  userId?: string;

  @ApiPropertyOptional({ example: 'guest@example.com' })
  @Expose()
  guestEmail?: string;

  @ApiPropertyOptional({ example: 'Jane' })
  @Expose()
  guestFirstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @Expose()
  guestLastName?: string;

  @ApiPropertyOptional()
  @Expose()
  paymentProviderId?: string;

  @ApiPropertyOptional()
  @Expose()
  paymentProviderRef?: string;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
