import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenEntity1752687200000 implements MigrationInterface {
  name = 'AddRefreshTokenEntity1752687200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "deviceInfo" character varying(255),
        CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_refresh_tokens_userId_tokenHash" ON "refresh_tokens" ("userId", "tokenHash")`,
    );

    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_userId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_userId_tokenHash"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
