import { Controller, Post, Body, RawBody, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { CreateGuestIntentDto } from './dto/create-guest-intent.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/types';

// Auth throttler not relevant for payment endpoints; use the default rate limit
@SkipThrottle({ auth: true })
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe/intent')
  @Auth(AuthType.Bearer)
  async createIntent(
    @Body() dto: CreateIntentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.paymentsService.createPaymentIntent(dto.orderId, user.id);
  }

  @Post('stripe/guest-intent')
  @Auth(AuthType.None)
  async createGuestIntent(@Body() dto: CreateGuestIntentDto) {
    return this.paymentsService.createGuestPaymentIntent(
      dto.orderId,
      dto.email,
    );
  }

  // Stripe sends webhooks from their own servers — exempt from all rate limits
  @SkipThrottle()
  @Post('stripe/webhook')
  @Auth(AuthType.None)
  async stripeWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhookEvent(rawBody, signature);
  }
}
