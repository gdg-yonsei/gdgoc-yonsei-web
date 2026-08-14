-- Better Auth uses record IDs as primary keys while Auth.js used provider/token
-- compound keys. Add and backfill the IDs before making them non-null so this
-- migration remains safe for databases that already contain auth data.
ALTER TABLE "account" DROP CONSTRAINT "account_provider_providerAccountId_pk";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_pkey";--> statement-breakpoint
ALTER TABLE "authenticator" DROP CONSTRAINT "authenticator_userId_credentialID_pk";--> statement-breakpoint
ALTER TABLE "verificationToken" DROP CONSTRAINT "verificationToken_identifier_token_pk";--> statement-breakpoint

ALTER TABLE "account" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "authenticator" ALTER COLUMN "providerAccountId" DROP NOT NULL;--> statement-breakpoint

ALTER TABLE "account" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "accessTokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refreshTokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

ALTER TABLE "session" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ipAddress" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "userAgent" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

ALTER TABLE "authenticator" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "authenticator" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "authenticator" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "authenticator" ADD COLUMN "aaguid" text;--> statement-breakpoint

ALTER TABLE "user" ADD COLUMN "betterAuthEmailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint

ALTER TABLE "verificationToken" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

UPDATE "account"
SET
  "id" = gen_random_uuid()::text,
  "accessTokenExpiresAt" = timezone('UTC', to_timestamp("expires_at"))
WHERE "id" IS NULL;--> statement-breakpoint
UPDATE "session" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;--> statement-breakpoint
UPDATE "authenticator"
SET
  "id" = gen_random_uuid()::text,
  -- Auth.js stored credential IDs as padded base64. WebAuthn JSON and Better
  -- Auth use unpadded base64url, so normalize existing credentials in place.
  "credentialID" = rtrim(translate("credentialID", '+/', '-_'), '=')
WHERE "id" IS NULL;--> statement-breakpoint
UPDATE "verificationToken" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;--> statement-breakpoint
UPDATE "user"
SET "betterAuthEmailVerified" = "emailVerified" IS NOT NULL;--> statement-breakpoint
UPDATE "user"
SET "email" = concat('legacy-', gen_random_uuid()::text, '@users.invalid')
WHERE "email" IS NULL;--> statement-breakpoint
UPDATE "user"
SET "name" = COALESCE("name", "email", "id")
WHERE "name" IS NULL;--> statement-breakpoint

ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "authenticator" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "authenticator" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "verificationToken" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint

CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_providerAccountId_unique" ON "account" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "authenticator_userId_idx" ON "authenticator" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "verificationToken_identifier_idx" ON "verificationToken" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_sessionToken_unique" UNIQUE("sessionToken");
