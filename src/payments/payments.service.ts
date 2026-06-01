import { Injectable } from '@nestjs/common';
import Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2026-05-27.dahlia' as any,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
  ): Promise<{ clientSecret: string }> {
    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return { clientSecret: intent.client_secret! };
  }
}
