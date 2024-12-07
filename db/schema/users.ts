import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersToParts } from "@/db/schema/users-to-parts";
import { usersToProjects } from "@/db/schema/users-to-projects";

export const roleEnum = pgEnum("role", [
  "member",
  "core",
  "lead",
  "alumnus",
  "unverified",
]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  generation: integer("generation").notNull().default(0),
  firstName: text("firstName"),
  lastName: text("lastName"),
  role: roleEnum("role").notNull().default("unverified"),
  githubId: text("githubId"),
  instagramId: text("instagramId"),
  linkedInId: text("linkedinId"),
});

export const usersRelations = relations(users, ({ many }) => ({
  usersToParts: many(usersToParts),
  usersToPartsRelations: many(usersToProjects),
}));
