import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Address } from '../../common/embeds/address.embed';

@Entity()
export class SavedAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  name: string;

  @Column(() => Address, { prefix: 'shipping' })
  shippingAddress: Address;

  @Column(() => Address, { prefix: 'billing' })
  billingAddress: Address;

  @Column({ default: false })
  billingIsSameAsShipping: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
