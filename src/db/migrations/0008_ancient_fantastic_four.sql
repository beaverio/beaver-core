ALTER TABLE "account_memberships" ADD COLUMN "roles" varchar(255)[] DEFAULT '{"OWNER"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "account_memberships" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."account_roles";