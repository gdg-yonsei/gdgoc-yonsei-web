ALTER TABLE "users_to_parts" DROP CONSTRAINT "users_to_parts_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_parts" DROP CONSTRAINT "users_to_parts_part_id_parts_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_parts" ADD CONSTRAINT "users_to_parts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_parts" ADD CONSTRAINT "users_to_parts_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;