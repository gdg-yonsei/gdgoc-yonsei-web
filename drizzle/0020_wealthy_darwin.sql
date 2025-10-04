CREATE TYPE "public"."partType" AS ENUM('Primary', 'Secondary');--> statement-breakpoint
ALTER TABLE "users_to_parts" ADD COLUMN "partType" "partType" DEFAULT 'Primary';