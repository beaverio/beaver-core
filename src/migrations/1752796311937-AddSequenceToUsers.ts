import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSequenceToUsers1752796311937 implements MigrationInterface {
  name = 'AddSequenceToUsers1752796311937';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "sequence" BIGSERIAL NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "sequence"`);
  }
}
