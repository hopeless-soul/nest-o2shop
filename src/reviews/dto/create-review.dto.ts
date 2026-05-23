import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane D.' })
  @IsString()
  displayName: string;

  @ApiProperty({ minimum: 1, maximum: 10, example: 8 })
  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @ApiProperty({ example: 'Great quality, fast shipping!' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String], example: ['https://example.com/photo.jpg'] })
  @IsOptional()
  @IsString({ each: true })
  photoUrls?: string[];
}
