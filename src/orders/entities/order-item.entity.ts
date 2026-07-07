import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  product?: Product;

  @Column()
  productName: string;

  @Column()
  productSku: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  productPrice: number;

  @Column({ length: 3 })
  productCurrency: string;

  @Column({ nullable: true })
  productImageUrl?: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  total: number;

  @CreateDateColumn()
  createdAt: Date;
}
