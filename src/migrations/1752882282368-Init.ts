import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1752882282368 implements MigrationInterface {
  name = 'Init1752882282368';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "lastLogin" bigint, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "userId" uuid NOT NULL, "tokenHash" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "deviceInfo" character varying(255), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7173a14ae8be0037fd46e425d1" ON "refresh_tokens" ("userId", "tokenHash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_2db43cdbf7bb862e577b5f540c8" UNIQUE ("name"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`,
    );
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7173a14ae8be0037fd46e425d1"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
