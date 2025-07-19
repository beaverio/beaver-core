import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountToFamily1752999999999 implements MigrationInterface {
  name = 'AccountToFamily1752999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename accounts table to families
    await queryRunner.query(`ALTER TABLE "accounts" RENAME TO "families"`);
    
    // Rename accountId column to familyId in memberships table
    await queryRunner.query(`ALTER TABLE "memberships" RENAME COLUMN "accountId" TO "familyId"`);
    
    // Drop old index and create new one with familyId
    await queryRunner.query(`DROP INDEX "IDX_memberships_userId_accountId"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_memberships_userId_familyId" ON "memberships" ("userId", "familyId")`);
    
    // Update foreign key constraint name
    await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_accountId"`);
    await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_familyId" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the foreign key constraint change
    await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT "FK_memberships_familyId"`);
    await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "FK_memberships_accountId" FOREIGN KEY ("familyId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    
    // Reverse the index change
    await queryRunner.query(`DROP INDEX "IDX_memberships_userId_familyId"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_memberships_userId_accountId" ON "memberships" ("userId", "familyId")`);
    
    // Reverse column rename
    await queryRunner.query(`ALTER TABLE "memberships" RENAME COLUMN "familyId" TO "accountId"`);
    
    // Reverse table rename
    await queryRunner.query(`ALTER TABLE "families" RENAME TO "accounts"`);
  }
}