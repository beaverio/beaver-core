import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSequenceFromUsers1752796544034 implements MigrationInterface {
    name = 'RemoveSequenceFromUsers1752796544034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "sequence"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "sequence" BIGSERIAL NOT NULL`);
    }

}
