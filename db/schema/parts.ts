import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { generations } from "@/db/schema/generations";
import { usersToParts } from "@/db/schema/users-to-parts";

export const parts = pgTable("parts", {
  id: serial("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  generationsId: integer("generationId"),
});

export const partsRelations = relations(parts, ({ one, many }) => ({
  generation: one(generations, {
    fields: [parts.generationsId],
    references: [generations.id],
  }),
  usersToParts: many(usersToParts),
}));
