import { MigrationInterface, QueryRunner } from 'typeorm';

export class Memberships1752882382368 implements MigrationInterface {
  name = 'Memberships1752882382368';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "userId" uuid NOT NULL, "accountId" uuid NOT NULL, "permissions" text NOT NULL, CONSTRAINT "PK_8ed69c6d87c76650ca17b8aad76" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_memberships_user_account" ON "memberships" ("userId", "accountId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_memberships_user_account"`,
    );
    await queryRunner.query(`DROP TABLE "memberships"`);
  }
}
