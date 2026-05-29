import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ProductPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne('Product', 'photos', { onDelete: 'CASCADE' })
  product: any;

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
    transformer: { to: (v) => v, from: (v) => (v == null ? v : parseFloat(v)) },
  })
  aspectRatio?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  /** Computed in service — not persisted */
  variantIds?: string[];
}
