import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity()
@Unique(['slug', 'categoryId'])
export class SubCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  slug: string;

  @Column()
  displayName: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category, (cat) => cat.subCategories, {
    onDelete: 'CASCADE',
  })
  category: Category;

  @OneToMany('Product', 'subCategory')
  products: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
