CREATE TABLE "users_to_generations" (
	"user_id" text NOT NULL,
	"generation_id" serial NOT NULL,
	CONSTRAINT "users_to_generations_user_id_generation_id_pk" PRIMARY KEY("user_id","generation_id")
);
--> statement-breakpoint
ALTER TABLE "users_to_generations" ADD CONSTRAINT "users_to_generations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_generations" ADD CONSTRAINT "users_to_generations_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;