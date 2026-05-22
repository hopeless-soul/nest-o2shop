import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  bannerImageUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  // products populated via ProductsModule — not circular because Product references Collection
  @OneToMany('Product', 'collection')
  products: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
