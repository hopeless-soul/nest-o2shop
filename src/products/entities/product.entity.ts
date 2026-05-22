import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Collection } from '../../collections/entities/collection.entity';
import { Category } from '../../categories/entities/category.entity';
import { SubCategory } from '../../categories/entities/subcategory.entity';
import { ProductPhoto } from './product-photo.entity';
import { ProductVariant } from './product-variant.entity';
import type { ProductDescription } from '../types/description-block.type';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  collectionId?: string;

  @ManyToOne(() => Collection, { nullable: true, onDelete: 'SET NULL' })
  collection?: Collection;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  category: Category;

  @Column()
  subCategoryId: string;

  @ManyToOne(() => SubCategory, { onDelete: 'RESTRICT' })
  subCategory: SubCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'jsonb' })
  description: ProductDescription;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  defaultVariantId?: string;

  @OneToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'defaultVariantId' })
  defaultVariant?: ProductVariant;

  @OneToMany(() => ProductPhoto, (photo) => photo.product, { cascade: true })
  photos: ProductPhoto[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany('Review', 'product')
  reviews: any[];

  @DeleteDateColumn()
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
