import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projectsToTags } from "@/db/schema/projects-to-tags";

export const tags = pgTable("tags", {
  id: serial("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  projectsToTags: many(projectsToTags),
}));
