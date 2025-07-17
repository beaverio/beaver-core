import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRefreshTokenFromUser1752687300000
  implements MigrationInterface
{
  name = 'RemoveRefreshTokenFromUser1752687300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refreshToken" character varying(255)`,
    );
  }
}
