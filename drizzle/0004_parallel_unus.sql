ALTER TABLE "projects_to_tags" DROP CONSTRAINT "projects_to_tags_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "projects_to_tags" DROP CONSTRAINT "projects_to_tags_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_parts" DROP CONSTRAINT "users_to_parts_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_parts" DROP CONSTRAINT "users_to_parts_part_id_parts_id_fk";
--> statement-breakpoint
ALTER TABLE "projects_to_tags" ADD CONSTRAINT "projects_to_tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects_to_tags" ADD CONSTRAINT "projects_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_parts" ADD CONSTRAINT "users_to_parts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_parts" ADD CONSTRAINT "users_to_parts_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE cascade;