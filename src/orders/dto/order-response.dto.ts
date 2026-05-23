import { Expose, Type } from 'class-transformer';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum';
import { OrderItemResponseDto } from './order-item-response.dto';

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

export class OrderResponseDto {
  @Expose() id: string;
  @Expose() orderNumber: string;
  @Expose() paymentStatus: PaymentStatus;
  @Expose() fulfillmentStatus: FulfillmentStatus;
  @Expose() totalAmount: number;
  @Expose() totalCurrency: string;
  @Expose() shippingMethodName: string;
  @Expose() shippingPrice: number;
  @Expose() shippingCurrency: string;
  @Expose() @Type(() => AddressResponseDto) shippingAddress: AddressResponseDto;
  @Expose() @Type(() => AddressResponseDto) billingAddress: AddressResponseDto;
  @Expose() @Type(() => OrderItemResponseDto) items: OrderItemResponseDto[];
  @Expose() createdAt: Date;
}

export class AdminOrderResponseDto extends OrderResponseDto {
  @Expose() userId?: string;
  @Expose() guestEmail?: string;
  @Expose() guestFirstName?: string;
  @Expose() guestLastName?: string;
  @Expose() paymentProviderId?: string;
  @Expose() paymentProviderRef?: string;
  @Expose() updatedAt: Date;
}
