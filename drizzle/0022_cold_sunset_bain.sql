ALTER TABLE "public"."sessions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TYPE "sessionType" ADD VALUE IF NOT EXISTS 'General Session';
ALTER TABLE "public"."sessions" ALTER COLUMN "type" SET DATA TYPE "public"."sessionType" USING "type"::"public"."sessionType";