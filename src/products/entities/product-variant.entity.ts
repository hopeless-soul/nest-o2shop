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
    transformer: { to: (v) => v, from: (v) => (v == null ? v : parseFloat(v)) },
  })
  priceOverride?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: { to: (v) => v, from: (v) => (v == null ? v : parseFloat(v)) },
  })
  compareAtPrice?: number | null;

  @Column({ type: 'int', nullable: true })
  weight?: number | null;

  @Column({ default: 'deny' })
  inventoryPolicy: 'deny' | 'continue';

  @Column({
    type: 'jsonb',
    default: () => `'{"min":1,"max":null,"increment":1}'`,
  })
  quantityRule: { min: number; max: number | null; increment: number };

  @Column({ type: 'varchar', nullable: true })
  barcode?: string | null;

  @Column({ name: 'mainPhotoId', nullable: true })
  featuredImageId?: string;

  @ManyToOne(() => ProductPhoto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mainPhotoId' })
  featuredImage?: ProductPhoto;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
