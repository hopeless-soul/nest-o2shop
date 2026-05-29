import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum';

export class FilterOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: PaymentStatus, enumName: 'PaymentStatus' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    enum: FulfillmentStatus,
    enumName: 'FulfillmentStatus',
  })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;

  @ApiPropertyOptional({ format: 'date-time', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}
