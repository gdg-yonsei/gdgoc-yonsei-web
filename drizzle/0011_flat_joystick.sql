ALTER TABLE "sessions" ADD COLUMN "openSession" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "maxCapacity" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "locationKo" text;