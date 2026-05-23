import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingMethodResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose() id: string;

  @ApiProperty({ example: 'Standard Shipping' })
  @Expose() name: string;

  @ApiProperty({ example: 5.99 })
  @Expose() price: number;

  @ApiProperty({ example: 'USD' })
  @Expose() currency: string;

  @ApiPropertyOptional({ example: 5 })
  @Expose() estimatedDays?: number;

  @ApiProperty({ example: true })
  @Expose() isActive: boolean;

  @ApiProperty()
  @Expose() createdAt: Date;

  @ApiProperty()
  @Expose() updatedAt: Date;
}
