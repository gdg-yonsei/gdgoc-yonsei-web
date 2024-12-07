CREATE TYPE "public"."role" AS ENUM('member', 'core', 'lead', 'alumnus', 'unverified');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"generationId" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"mainImage" text DEFAULT '/project-default.png' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_to_parts" (
	"user_id" text NOT NULL,
	"part_id" serial NOT NULL,
	CONSTRAINT "users_to_parts_user_id_part_id_pk" PRIMARY KEY("user_id","part_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_to_projects" (
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "users_to_projects_user_id_project_id_pk" PRIMARY KEY("user_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "generation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "firstName" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastName" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "githubId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "instagramId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "linkedinId" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parts" ADD CONSTRAINT "parts_generationId_generations_id_fk" FOREIGN KEY ("generationId") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_parts" ADD CONSTRAINT "users_to_parts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_parts" ADD CONSTRAINT "users_to_parts_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_projects" ADD CONSTRAINT "users_to_projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_projects" ADD CONSTRAINT "users_to_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
