import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDeletedAt1752857610000 implements MigrationInterface {
  name = 'RemoveDeletedAt1752857610000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" bigint`);
  }
}
