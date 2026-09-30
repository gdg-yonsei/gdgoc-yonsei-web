CREATE TABLE "mcp_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"userId" text,
	"role" "role" NOT NULL,
	"clientId" text,
	"clientName" text,
	"tool" text NOT NULL,
	"input" jsonb NOT NULL,
	"outcome" text NOT NULL,
	"errorCode" text,
	"targetId" text,
	"durationMs" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_audit_log" ADD CONSTRAINT "mcp_audit_log_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcp_audit_log_userId_createdAt_idx" ON "mcp_audit_log" USING btree ("userId","createdAt");