import "server-only";
import db from "@/db";
import { users } from "@/db/schema/users";

export async function getUsers() {
  return db.select().from(users);
}

export type GetUsersType = Awaited<ReturnType<typeof getUsers>>;
