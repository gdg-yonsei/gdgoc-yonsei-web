ALTER TABLE "projects" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "content" text DEFAULT '' NOT NULL;