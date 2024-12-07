import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersToParts } from "@/db/schema/users-to-parts";
import { usersToProjects } from "@/db/schema/users-to-projects";

/**
 * @desc 사용자 권한 및 역할
 * @member GDGoC 멤버
 * @core 각 파트장
 * @lead Organizer
 * @alumnus 알럼나이
 * @unverified 가입 후 기본 상태 (일반 멤버로 전환 필요)
 */
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
