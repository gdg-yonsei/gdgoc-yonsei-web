CREATE TABLE "external_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstName" text,
	"firstNameKo" text,
	"lastName" text,
	"lastNameKo" text,
	"studentId" text,
	"email" text,
	"createdAt" timestamp DEFAULT now(),
	"sessionId" uuid NOT NULL
);
