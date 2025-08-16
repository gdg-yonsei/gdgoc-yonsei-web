CREATE TABLE "userToSession" (
	"user_id" text NOT NULL,
	"sessionId" uuid NOT NULL,
	CONSTRAINT "userToSession_user_id_sessionId_pk" PRIMARY KEY("user_id","sessionId")
);
--> statement-breakpoint
ALTER TABLE "userToSession" ADD CONSTRAINT "userToSession_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "userToSession" ADD CONSTRAINT "userToSession_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE cascade;