import { Expose } from 'class-transformer';

export class CollectionResponseDto {
  @Expose() id: string;
  @Expose() slug: string;
  @Expose() displayName: string;
  @Expose() description?: string;
  @Expose() bannerImageUrl?: string;
  @Expose() isActive: boolean;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}

export class AdminCollectionResponseDto extends CollectionResponseDto {}
