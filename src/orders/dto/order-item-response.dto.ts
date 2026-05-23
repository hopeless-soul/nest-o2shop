import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose() id: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @Expose() productId?: string;

  @ApiProperty({ example: 'Blue Widget' })
  @Expose() productName: string;

  @ApiProperty({ example: 'BLU-M-001' })
  @Expose() productSku: string;

  @ApiProperty({ example: 29.99 })
  @Expose() productPrice: number;

  @ApiProperty({ example: 'USD' })
  @Expose() productCurrency: string;

  @ApiProperty({ example: 2 })
  @Expose() quantity: number;

  @ApiProperty({ example: 59.98 })
  @Expose() total: number;
}
