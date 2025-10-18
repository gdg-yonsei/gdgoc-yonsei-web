ALTER TYPE "public"."partType" RENAME TO "userType";--> statement-breakpoint
ALTER TYPE "public"."userType" ADD VALUE 'Core' BEFORE 'Primary';--> statement-breakpoint
ALTER TABLE "users_to_parts" RENAME COLUMN "partType" TO "userType";