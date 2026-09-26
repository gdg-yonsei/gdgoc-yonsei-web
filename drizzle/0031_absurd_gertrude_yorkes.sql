-- `sessions.partId` was mistakenly created as `serial('sessionId')`: wrong
-- column name, an auto-increment default and NOT NULL. Rename it, strip the
-- serial residue and add the missing foreign keys. All FKs are NOT VALID so
-- existing rows are not re-validated on deploy; new writes are enforced.
ALTER TABLE "sessions" RENAME COLUMN "sessionId" TO "partId";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "partId" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "partId" DROP NOT NULL;--> statement-breakpoint
DROP SEQUENCE IF EXISTS "sessions_sessionId_seq";--> statement-breakpoint
ALTER TABLE "external_participants" ADD CONSTRAINT "external_participants_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE cascade NOT VALID;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_generationId_generations_id_fk" FOREIGN KEY ("generationId") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE cascade NOT VALID;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_partId_parts_id_fk" FOREIGN KEY ("partId") REFERENCES "public"."parts"("id") ON DELETE set null ON UPDATE cascade NOT VALID;
