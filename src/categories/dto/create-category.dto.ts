import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'clothing', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case',
  })
  slug: string;

  @ApiProperty({ example: 'Clothing' })
  @IsString()
  displayName: string;
}
