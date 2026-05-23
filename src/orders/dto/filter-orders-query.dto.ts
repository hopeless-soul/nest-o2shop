import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum';

export class FilterOrdersQueryDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;
  @IsOptional() @IsDateString() createdAfter?: string;
  @IsOptional() @IsDateString() createdBefore?: string;
}
