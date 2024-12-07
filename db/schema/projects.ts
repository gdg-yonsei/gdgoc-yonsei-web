import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersToProjects } from "@/db/schema/users-to-projects";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  mainImage: text("mainImage").notNull().default("/project-default.png"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  usersToParts: many(usersToProjects),
}));
