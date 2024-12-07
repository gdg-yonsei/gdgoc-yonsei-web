import { users } from "@/db/schema/users";
import { parts } from "@/db/schema/parts";
import { pgTable, primaryKey, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const usersToParts = pgTable(
  "users_to_parts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    partId: serial("part_id")
      .notNull()
      .references(() => parts.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.partId] }),
  }),
);

export const usersToPartsRelations = relations(usersToParts, ({ one }) => ({
  part: one(parts, {
    fields: [usersToParts.partId],
    references: [parts.id],
  }),
  user: one(users, {
    fields: [usersToParts.userId],
    references: [users.id],
  }),
}));
