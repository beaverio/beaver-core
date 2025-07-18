import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1752857510273 implements MigrationInterface {
  name = 'Init1752857510273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "lastLogin" bigint`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" bigint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLogin"`);
  }
}
