import { IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum';

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;
}
