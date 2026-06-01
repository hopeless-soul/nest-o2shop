import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe.Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
  ): Promise<{ clientSecret: string }> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
      });
      return { clientSecret: intent.client_secret! };
    } catch {
      throw new InternalServerErrorException('Payment processing failed');
    }
  }
}
