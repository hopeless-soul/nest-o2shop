import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'BLU-M-001' })
  @IsString()
  variantSku: string;

  @ApiProperty({ minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
