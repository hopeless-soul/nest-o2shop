import { IsString, Matches } from 'class-validator';

export class CreateSubCategoryDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case',
  })
  slug: string;

  @IsString()
  displayName: string;
}
