import { Expose } from 'class-transformer';

export class OrderItemResponseDto {
  @Expose() id: string;
  @Expose() productId?: string;
  @Expose() productName: string;
  @Expose() productSku: string;
  @Expose() productPrice: number;
  @Expose() productCurrency: string;
  @Expose() quantity: number;
  @Expose() total: number;
}
