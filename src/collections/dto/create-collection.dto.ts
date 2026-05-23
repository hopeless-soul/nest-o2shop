import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ example: 'summer-2025', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case (e.g. summer-2025)',
  })
  slug: string;

  @ApiProperty({ example: 'Summer 2025' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ example: 'Our summer collection featuring...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
