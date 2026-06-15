import { IsEmail, IsUUID } from 'class-validator';

export class CreateGuestIntentDto {
  @IsUUID()
  orderId: string;

  @IsEmail()
  email: string;
}
