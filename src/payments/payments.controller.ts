import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe/intent')
  async createIntent(@Body() dto: CreateIntentDto) {
    return await this.paymentsService.createPaymentIntent(
      dto.amount,
      dto.currency,
    );
  }
}
