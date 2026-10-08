CREATE TABLE "announcement_reads" (
	"announcementId" uuid NOT NULL,
	"userId" text NOT NULL,
	"readAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "announcement_reads_announcementId_userId_pk" PRIMARY KEY("announcementId","userId")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"ctaLabel" text,
	"ctaHref" text,
	"authorId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcementId_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_createdAt_idx" ON "announcements" USING btree ("createdAt");