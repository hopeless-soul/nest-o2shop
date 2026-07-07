import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ShippingMethod } from '../../shipping/entities/shipping-method.entity';
import { Address } from '../../common/embeds/address.embed';
import { PaymentStatus } from '../enums/payment-status.enum';
import { FulfillmentStatus } from '../enums/fulfillment-status.enum';
import { OrderItem } from './order-item.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ type: 'int' })
  orderSequence: number;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: FulfillmentStatus,
    default: FulfillmentStatus.UNFULFILLED,
  })
  fulfillmentStatus: FulfillmentStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalAmount: number;

  @Column({ length: 3 })
  totalCurrency: string;

  @Column({ nullable: true })
  shippingMethodId?: string;

  @ManyToOne(() => ShippingMethod, { nullable: true, onDelete: 'SET NULL' })
  shippingMethod?: ShippingMethod;

  @Column()
  shippingMethodName: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  shippingPrice: number;

  @Column({ length: 3 })
  shippingCurrency: string;

  @Column(() => Address, { prefix: 'shipping' })
  shippingAddress: Address;

  @Column(() => Address, { prefix: 'billing' })
  billingAddress: Address;

  @Column({ nullable: true })
  paymentProviderId?: string;

  @Column({ nullable: true })
  paymentProviderRef?: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'jsonb', default: '[]' })
  notes: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
