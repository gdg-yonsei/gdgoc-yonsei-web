ALTER TABLE "sessions" RENAME COLUMN "openSession" TO "internalOpen";--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "publicOpen" boolean DEFAULT false;