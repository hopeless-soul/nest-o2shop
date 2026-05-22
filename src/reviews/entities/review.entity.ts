import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewStatus } from '../enums/review-status.enum';

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, 'reviews', { onDelete: 'CASCADE' })
  product: Product;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @Column()
  email: string;

  @Column()
  displayName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ type: 'simple-array', nullable: true })
  photoUrls?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
