import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1783208594146 implements MigrationInterface {
  name = 'Migration1783208594146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD "productImageUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_item" DROP COLUMN "productImageUrl"`,
    );
  }
}
