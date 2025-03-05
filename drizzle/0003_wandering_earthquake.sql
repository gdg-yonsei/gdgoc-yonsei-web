ALTER TABLE "users_to_projects" DROP CONSTRAINT "users_to_projects_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_projects" DROP CONSTRAINT "users_to_projects_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_projects" ADD CONSTRAINT "users_to_projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_projects" ADD CONSTRAINT "users_to_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;