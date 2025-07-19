import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1752951240832 implements MigrationInterface {
  name = 'Init1752951240832';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_account"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_memberships_user_account"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b1e06e78e76d78510627bc7c59" ON "memberships" ("userId", "accountId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_187d573e43b2c2aa3960df20b78" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_5d2beef61e72e238550fbb5f7de" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_5d2beef61e72e238550fbb5f7de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_187d573e43b2c2aa3960df20b78"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1e06e78e76d78510627bc7c59"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_memberships_user_account" ON "memberships" ("userId", "accountId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
