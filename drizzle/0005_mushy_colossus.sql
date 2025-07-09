ALTER TABLE "projects" ADD COLUMN "nameKo" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "descriptionKo" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "contentKo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "nameKo" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "descriptionKo" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "firstNameKo" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastNameKo" text;