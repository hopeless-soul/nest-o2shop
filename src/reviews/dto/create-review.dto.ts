import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsEmail()
  email: string;

  @IsString()
  displayName: string;

  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsString({ each: true })
  photoUrls?: string[];
}
