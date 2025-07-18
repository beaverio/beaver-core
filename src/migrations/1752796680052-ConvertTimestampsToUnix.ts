import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertTimestampsToUnix1752796680052 implements MigrationInterface {
  name = 'ConvertTimestampsToUnix1752796680052'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convert users table timestamps
    // Add temporary columns for Unix timestamps
    await queryRunner.query(`ALTER TABLE "users" ADD "createdAt_unix" bigint`);
    await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt_unix" bigint`);

    // Convert existing timestamp data to Unix timestamps (milliseconds)
    await queryRunner.query(`UPDATE "users" SET "createdAt_unix" = EXTRACT(EPOCH FROM "createdAt") * 1000`);
    await queryRunner.query(`UPDATE "users" SET "updatedAt_unix" = EXTRACT(EPOCH FROM "updatedAt") * 1000`);

    // Drop old timestamp columns and rename new ones
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "createdAt_unix" TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "updatedAt_unix" TO "updatedAt"`);

    // Make the new columns non-nullable
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET NOT NULL`);

    // Convert refresh_tokens table timestamps
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "createdAt_unix" bigint`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "updatedAt_unix" bigint`);

    await queryRunner.query(`UPDATE "refresh_tokens" SET "createdAt_unix" = EXTRACT(EPOCH FROM "createdAt") * 1000`);
    await queryRunner.query(`UPDATE "refresh_tokens" SET "updatedAt_unix" = EXTRACT(EPOCH FROM "updatedAt") * 1000`);

    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "createdAt_unix" TO "createdAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "updatedAt_unix" TO "updatedAt"`);

    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "createdAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "updatedAt" SET NOT NULL`);
  } public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert back to timestamp columns
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "updatedAt_ts" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "createdAt_ts" TIMESTAMP WITH TIME ZONE`);

    await queryRunner.query(`UPDATE "refresh_tokens" SET "updatedAt_ts" = to_timestamp("updatedAt" / 1000)`);
    await queryRunner.query(`UPDATE "refresh_tokens" SET "createdAt_ts" = to_timestamp("createdAt" / 1000)`);

    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "updatedAt_ts" TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" RENAME COLUMN "createdAt_ts" TO "createdAt"`);

    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "updatedAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "createdAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "createdAt" SET DEFAULT now()`);

    await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt_ts" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD "createdAt_ts" TIMESTAMP WITH TIME ZONE`);

    await queryRunner.query(`UPDATE "users" SET "updatedAt_ts" = to_timestamp("updatedAt" / 1000)`);
    await queryRunner.query(`UPDATE "users" SET "createdAt_ts" = to_timestamp("createdAt" / 1000)`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "updatedAt_ts" TO "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "createdAt_ts" TO "createdAt"`);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now()`);
  }
}