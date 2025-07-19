import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1752958527800 implements MigrationInterface {
  name = 'Init1752958527800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_5d2beef61e72e238550fbb5f7de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1e06e78e76d78510627bc7c59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" RENAME COLUMN "accountId" TO "familyId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "families" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_083e295fc64ec128618c5e37139" UNIQUE ("name"), CONSTRAINT "PK_70414ac0c8f45664cf71324b9bb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4f62114099eb0b1fc140489007" ON "memberships" ("userId", "familyId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_f6d45c42de9f46aa64c650633ea" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_f6d45c42de9f46aa64c650633ea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f62114099eb0b1fc140489007"`,
    );
    await queryRunner.query(`DROP TABLE "families"`);
    await queryRunner.query(
      `ALTER TABLE "memberships" RENAME COLUMN "familyId" TO "accountId"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b1e06e78e76d78510627bc7c59" ON "memberships" ("userId", "accountId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_5d2beef61e72e238550fbb5f7de" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
