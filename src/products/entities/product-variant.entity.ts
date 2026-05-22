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

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceOverride?: number;

  @Column({ nullable: true })
  mainPhotoId?: string;

  @ManyToOne(() => ProductPhoto, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mainPhotoId' })
  mainPhoto?: ProductPhoto;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
