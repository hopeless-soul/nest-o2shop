import { IsNumber, IsString, Min } from 'class-validator';

export class CreateIntentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  currency: string;
}
