import { Controller, Post, Body, RawBody, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe/intent')
  @Auth(AuthType.None)
  async createIntent(@Body() dto: CreateIntentDto) {
    return this.paymentsService.createPaymentIntent(dto.orderId);
  }

  @Post('stripe/webhook')
  @Auth(AuthType.None)
  async stripeWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhookEvent(rawBody, signature);
  }
}
