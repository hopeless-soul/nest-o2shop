import { Expose } from 'class-transformer';

export class ShippingMethodResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() price: number;
  @Expose() currency: string;
  @Expose() estimatedDays?: number;
  @Expose() isActive: boolean;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
