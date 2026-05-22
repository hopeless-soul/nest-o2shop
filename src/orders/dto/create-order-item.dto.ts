import { IsInt, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  variantSku: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
