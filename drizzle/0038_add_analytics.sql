CREATE TABLE "analytics_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"sessionId" uuid NOT NULL,
	"pageViewId" uuid NOT NULL,
	"occurredAt" timestamp NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"label" text,
	"targetUrl" text,
	"metric" text,
	"rating" text,
	"value" double precision
);
--> statement-breakpoint
CREATE TABLE "analytics_page_views" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sessionId" uuid NOT NULL,
	"visitorId" uuid NOT NULL,
	"occurredAt" timestamp NOT NULL,
	"sequence" smallint NOT NULL,
	"path" text NOT NULL,
	"locale" text NOT NULL,
	"title" text,
	"isNotFound" boolean DEFAULT false NOT NULL,
	"engagementMs" integer DEFAULT 0 NOT NULL,
	"maxScrollPercent" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"visitorId" uuid NOT NULL,
	"startedAt" timestamp NOT NULL,
	"lastSeenAt" timestamp NOT NULL,
	"isNewVisitor" boolean NOT NULL,
	"isInternal" boolean NOT NULL,
	"landingPath" text NOT NULL,
	"referrerHost" text,
	"referrerPath" text,
	"utmSource" text,
	"utmMedium" text,
	"utmCampaign" text,
	"utmTerm" text,
	"utmContent" text,
	"channel" text NOT NULL,
	"deviceType" text NOT NULL,
	"browser" text NOT NULL,
	"os" text NOT NULL,
	"screenWidth" smallint,
	"screenHeight" smallint,
	"language" text,
	"timezone" text,
	"country" char(2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_sessionId_analytics_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."analytics_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_pageViewId_analytics_page_views_id_fk" FOREIGN KEY ("pageViewId") REFERENCES "public"."analytics_page_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_page_views" ADD CONSTRAINT "analytics_page_views_sessionId_analytics_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."analytics_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_name_occurredAt_idx" ON "analytics_events" USING btree ("name","occurredAt");--> statement-breakpoint
CREATE INDEX "analytics_events_pageViewId_idx" ON "analytics_events" USING btree ("pageViewId");--> statement-breakpoint
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "analytics_page_views_occurredAt_idx" ON "analytics_page_views" USING btree ("occurredAt");--> statement-breakpoint
CREATE INDEX "analytics_page_views_path_occurredAt_idx" ON "analytics_page_views" USING btree ("path","occurredAt");--> statement-breakpoint
CREATE INDEX "analytics_page_views_sessionId_sequence_idx" ON "analytics_page_views" USING btree ("sessionId","sequence");--> statement-breakpoint
CREATE INDEX "analytics_sessions_startedAt_idx" ON "analytics_sessions" USING btree ("startedAt");--> statement-breakpoint
CREATE INDEX "analytics_sessions_visitorId_startedAt_idx" ON "analytics_sessions" USING btree ("visitorId","startedAt");