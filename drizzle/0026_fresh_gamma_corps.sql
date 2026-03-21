DO $$ BEGIN
  CREATE TYPE "public"."bookingStatus" AS ENUM('PENDING', 'SCHEDULED', 'SUCCESS', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"externalId" text,
	"roomName" text NOT NULL,
	"building" text NOT NULL,
	"campus" text NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"eventName" text NOT NULL,
	"eventType" text NOT NULL,
	"attendees" integer NOT NULL,
	"contactPhone" text NOT NULL,
	"status" "bookingStatus" DEFAULT 'PENDING' NOT NULL,
	"requestedById" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_requestedById_user_id_fk" FOREIGN KEY ("requestedById") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;