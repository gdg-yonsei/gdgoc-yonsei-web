CREATE TYPE "public"."activityCategory" AS ENUM('tech_talk', 'part_session', 'hackathon', 'demo_day', 'devrel');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repoUrl" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "demoUrl" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "category" "activityCategory" DEFAULT 'tech_talk' NOT NULL;--> statement-breakpoint
UPDATE "sessions" SET "category" = 'part_session' WHERE "type" = 'Part Session';