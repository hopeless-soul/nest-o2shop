import { Column } from 'typeorm';

export class Address {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  company?: string;

  @Column()
  address1: string;

  @Column({ nullable: true })
  address2?: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column()
  province: string;

  @Column()
  postalCode: string;

  @Column()
  phone: string;
}
