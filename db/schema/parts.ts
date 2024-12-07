import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { generations } from "@/db/schema/generations";
import { usersToParts } from "@/db/schema/users-to-parts";

export const parts = pgTable("parts", {
  id: serial("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  generationsId: serial("generationId").references(() => generations.id, {
    onDelete: "no action",
    onUpdate: "cascade",
  }),
});

export const partsRelations = relations(parts, ({ many }) => ({
  usersToParts: many(usersToParts),
}));
