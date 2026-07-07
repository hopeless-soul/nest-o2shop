import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { nullableDecimalTransformer } from '../../common/transformers/decimal.transformer';
// `import type` is erased at compile time, so this doesn't create the runtime
// circular require that a value import would (Product also references ProductPhoto).
import type { Product } from './product.entity';

@Entity()
export class ProductPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne('Product', 'photos', { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  url: string;

  @Column({ nullable: true })
  altText?: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'int', nullable: true })
  width?: number | null;

  @Column({ type: 'int', nullable: true })
  height?: number | null;

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 4,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  aspectRatio?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  /** Computed in service — not persisted */
  variantIds?: string[];
}
