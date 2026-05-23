import { Expose, Type } from 'class-transformer';
import { ProductPhotoResponseDto } from './product-photo-response.dto';

export class ProductVariantResponseDto {
  @Expose() id: string;
  @Expose() productId: string;
  @Expose() colorName: string;
  @Expose() colorValue: string;
  @Expose() size: string;
  @Expose() sku: string;
  @Expose() stock: number;
  @Expose() priceOverride?: number;
  @Expose() mainPhotoId?: string;
  @Expose()
  @Type(() => ProductPhotoResponseDto)
  mainPhoto?: ProductPhotoResponseDto;
}
