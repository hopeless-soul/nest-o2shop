import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781521557417 implements MigrationInterface {
    name = 'Migration1781521557417'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variant" ALTER COLUMN "quantityRule" SET DEFAULT '{"min":1,"max":null,"increment":1}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variant" ALTER COLUMN "quantityRule" SET DEFAULT '{"max": null, "min": 1, "increment": 1}'`);
    }

}
