ALTER TABLE "sessions" ADD COLUMN "startAt" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "endAt" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "eventDate";