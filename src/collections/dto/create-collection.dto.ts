import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case (e.g. summer-2025)',
  })
  slug: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
