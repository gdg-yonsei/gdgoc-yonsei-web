CREATE TYPE "public"."sessionType" AS ENUM('T19', 'Part Session');--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "type" "sessionType";