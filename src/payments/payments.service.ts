import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order } from '../orders/entities/order.entity';
import { PaymentStatus } from '../orders/enums/payment-status.enum';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe.Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {
    this.stripe = new Stripe(this.configService.getOrThrow('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-05-27.dahlia',
    });
  }

  async createPaymentIntent(orderId: string, userId: string): Promise<{ clientSecret: string }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    return this.buildPaymentIntent(order);
  }

  async createGuestPaymentIntent(orderId: string, email: string): Promise<{ clientSecret: string }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, email, userId: IsNull() },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    return this.buildPaymentIntent(order);
  }

  private async buildPaymentIntent(order: Order): Promise<{ clientSecret: string }> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100),
        currency: order.totalCurrency,
        automatic_payment_methods: { enabled: true },
        metadata: { orderId: order.id },
      });

      order.paymentProviderRef = intent.id;
      await this.orderRepo.save(order);

      return { clientSecret: intent.client_secret! };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Payment processing failed');
    }
  }

  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    let event: ReturnType<Stripe.Stripe['webhooks']['constructEvent']>;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const obj = event.data.object as { id: string };
        await this.updateOrderStatus(obj.id, PaymentStatus.PAID);
        break;
      }
      case 'payment_intent.payment_failed': {
        const obj = event.data.object as { id: string };
        await this.updateOrderStatus(obj.id, PaymentStatus.FAILED);
        break;
      }
      case 'charge.refunded': {
        const obj = event.data.object as { payment_intent: string | null };
        if (obj.payment_intent) {
          await this.updateOrderStatus(obj.payment_intent, PaymentStatus.REFUNDED);
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  private async updateOrderStatus(paymentIntentId: string, status: PaymentStatus): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { paymentProviderRef: paymentIntentId },
    });
    if (!order) {
      this.logger.warn(`Webhook: no order found for payment intent ${paymentIntentId}`);
      return;
    }
    order.paymentStatus = status;
    await this.orderRepo.save(order);
  }
}
