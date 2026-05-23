import { Expose } from 'class-transformer';

export class ProductPhotoResponseDto {
  @Expose() id: string;
  @Expose() url: string;
  @Expose() altText?: string;
  @Expose() sortOrder: number;
}
