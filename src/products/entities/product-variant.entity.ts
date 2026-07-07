import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductPhoto } from './product-photo.entity';
import { nullableDecimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity()
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column()
  colorName: string;

  @Column()
  colorValue: string;

  @Column()
  size: string;

  @Column({ unique: true })
  sku: string;

  @Column({ default: 0 })
  stock: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  priceOverride?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  compareAtPrice?: number | null;

  @Column({ type: 'int', nullable: true })
  weight?: number | null;

  // Note: What is this for?
  @Column({
    type: 'jsonb',
    default: () => `'{"min":1,"max":null,"increment":1}'`,
  })
  quantityRule: { min: number; max: number | null; increment: number };

  @Column({ name: 'mainPhotoId', nullable: true })
  featuredImageId?: string;

  @ManyToOne(() => ProductPhoto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mainPhotoId' })
  featuredImage?: ProductPhoto;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** Computed in service — not persisted */
  available?: boolean;
}
