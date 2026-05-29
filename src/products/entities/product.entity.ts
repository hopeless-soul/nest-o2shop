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

  @ManyToOne(() => SubCategory, {  onDelete: 'RESTRICT' })
  subCategory: SubCategory;

  // Note: the type is currently being used as main tag
  @Column({ nullable: true, default: null })
  type?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v) => v, from: (v) => parseFloat(v) },
  })
  basePrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: { to: (v) => v, from: (v) => (v == null ? v : parseFloat(v)) },
  })
  compareAtPrice?: number | null;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb' })
  description: ProductDescription;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  defaultVariantId?: string;

  @OneToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'defaultVariantId' })
  defaultVariant?: ProductVariant;

  @Column({ nullable: true })
  primaryPhotoId: string | null;

  @ManyToOne(() => ProductPhoto, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'primaryPhotoId' })
  primaryPhoto: ProductPhoto | null;

  @Column({ nullable: true })
  featuredPhotoId: string | null;

  @ManyToOne(() => ProductPhoto, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'featuredPhotoId' })
  featuredPhoto: ProductPhoto | null;

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
