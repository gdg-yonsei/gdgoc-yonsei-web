CREATE TABLE "mcp_image_upload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"objectKey" text,
	"userId" text,
	"kind" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"completedAt" timestamp,
	"rejectedAt" timestamp,
	"claimedAt" timestamp,
	CONSTRAINT "mcp_image_upload_objectKey_unique" UNIQUE("objectKey")
);
--> statement-breakpoint
ALTER TABLE "mcp_image_upload" ADD CONSTRAINT "mcp_image_upload_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcp_image_upload_userId_createdAt_idx" ON "mcp_image_upload" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "mcp_image_upload_expiresAt_idx" ON "mcp_image_upload" USING btree ("expiresAt");